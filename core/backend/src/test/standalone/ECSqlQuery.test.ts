/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { assert } from "chai";
import { DbResult, Id64 } from "@bentley/bentleyjs-core";
import { IModelDb, SnapshotDb } from "../../imodeljs-backend";
import { IModelTestUtils } from "../IModelTestUtils";
import { ECSqlStatement } from "../../ECSqlStatement";

// cspell:ignore mirukuru ibim

async function executeQuery(iModel: IModelDb, ecsql: string, bindings?: any[] | object): Promise<any[]> {
  const rows: any[] = [];
  for await (const row of iModel.query(ecsql, bindings)) {
    rows.push(row);
  }
  return rows;
}

describe("ECSql Query", () => {
  let imodel1: SnapshotDb;
  let imodel2: SnapshotDb;
  let imodel3: SnapshotDb;
  let imodel4: SnapshotDb;
  let imodel5: SnapshotDb;

  before(async () => {
    imodel1 = SnapshotDb.openFile(IModelTestUtils.resolveAssetFile("test.bim"));
    imodel2 = SnapshotDb.openFile(IModelTestUtils.resolveAssetFile("CompatibilityTestSeed.bim"));
    imodel3 = SnapshotDb.openFile(IModelTestUtils.resolveAssetFile("GetSetAutoHandledStructProperties.bim"));
    imodel4 = SnapshotDb.openFile(IModelTestUtils.resolveAssetFile("GetSetAutoHandledArrayProperties.bim"));
    imodel5 = SnapshotDb.openFile(IModelTestUtils.resolveAssetFile("mirukuru.ibim"));
  });

  after(async () => {
    imodel1.close();
    imodel2.close();
    imodel3.close();
    imodel4.close();
    imodel5.close();
  });

  it("Geom functions over concurrent query", async () => {
    let totalArea = 0;
    for await (const row of imodel1.query("SELECT iModel_bbox_areaxy(iModel_bbox(BBoxLow.X,BBoxLow.Y,BBoxLow.Z,BBoxHigh.X,BBoxHigh.Y,BBoxHigh.Z)) areaxy FROM bis.GeometricElement3d order by ecinstanceid")) {
      totalArea += row.areaxy;
    }
    assert.equal(Math.round(totalArea), 1213);
  });

  it.only("CTE series", async () => {
    const cteQuery = "WITH RECURSIVE cnt(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM cnt WHERE x<5) SELECT SUM(x) FROM cnt";
    const actual = imodel1.withPreparedStatement(cteQuery, (stmt: ECSqlStatement) => {
      assert.equal(stmt.step(), DbResult.BE_SQLITE_ROW);
      return stmt.getValue(0).getInteger();
    });
    assert.equal(actual, 15);
  });

  it("CTE fractal", async () => {
    const cteQuery = `
      WITH RECURSIVE
        [xaxis]([x]) AS (
          VALUES (- 2.0)
          UNION ALL
          SELECT [x] + 0.05 FROM   [xaxis] WHERE  [x] < 1.2
        ),
        [yaxis]([y]) AS(
          VALUES (- 1.0)
          UNION ALL
          SELECT [y] + 0.1 FROM   [yaxis] WHERE  [y] < 1.0
        ),
        [m]([iter], [cx], [cy], [x], [y]) AS (
          SELECT 0, [x], [y], 0.0, 0.0 FROM   [xaxis], [yaxis]
          UNION ALL
          SELECT
                [iter] + 1,
                [cx],
                [cy],
                [x] * [x] - [y] * [y] + [cx],
                2.0 * [x] * [y] + [cy]
          FROM   [m] WHERE  ([x] * [x] + [y] * [y]) < 4.0 AND [iter] < 28
        ),
        [m2]([iter], [cx], [cy]) AS(
          SELECT MAX ([iter]), [cx], [cy] FROM [m] GROUP  BY [cx], [cy]
        ),
        [a]([t]) AS(
          SELECT GROUP_CONCAT (SUBSTR (' .+*#', 1 + (CASE WHEN [iter] / 7 > 4 THEN 4 ELSE [iter] / 7 END), 1), '') FROM   [m2] GROUP  BY [cy]
        )
      SELECT GROUP_CONCAT (RTRIM ([t]), CHAR (0xa)) fractal FROM   [a]
      `;

    const expected = [
      "                                    ....#",
      "                                   ..#*..",
      "                                 ..+####+.",
      "                            .......+####....   +",
      "                           ..##+*##########+.++++",
      "                          .+.##################+.",
      "              .............+###################+.+",
      "              ..++..#.....*#####################+.",
      "             ...+#######++#######################.",
      "          ....+*################################.",
      " #############################################...",
      "          ....+*################################.",
      "             ...+#######++#######################.",
      "              ..++..#.....*#####################+.",
      "              .............+###################+.+",
      "                          .+.##################+.",
      "                           ..##+*##########+.++++",
      "                            .......+####....   +",
      "                                 ..+####+.",
      "                                   ..#*..",
      "                                    ....#",
      "                                    +."
    ];

    const actual = imodel1.withPreparedStatement(cteQuery, (stmt: ECSqlStatement) => {
      assert.equal(stmt.step(), DbResult.BE_SQLITE_ROW);
      return stmt.getValue(0).getString();
    });

    assert.equal(actual, expected.join("\n"));
  });
  // new new addon build
  it("ECSQL with BLOB", async () => {
    let rows = await executeQuery(imodel1, "SELECT ECInstanceId,GeometryStream FROM bis.GeometricElement3d WHERE GeometryStream IS NOT NULL LIMIT 1");
    assert.equal(rows.length, 1);
    const row: any = rows[0];

    assert.isTrue(Id64.isValidId64(row.id));

    assert.isDefined(row.geometryStream);
    const geomStream: Uint8Array = row.geometryStream;
    assert.isAtLeast(geomStream.byteLength, 1);

    rows = await executeQuery(imodel1, "SELECT 1 FROM bis.GeometricElement3d WHERE GeometryStream=?", [geomStream]);
    assert.equal(rows.length, 1);
  });

  it("Restart query", async () => {
    let cancelled = 0;
    let successful = 0;
    let rowCount = 0;
    const cb = async () => {
      return new Promise(async (resolve, reject) => {
        try {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          for await (const _row of imodel1.restartQuery("tag", "SELECT ECInstanceId as Id, Parent.Id as ParentId FROM BisCore.element")) {
            rowCount++;
          }
          successful++;
          resolve();
        } catch (err) {
          // we expect query to be cancelled
          if (err.errorNumber === DbResult.BE_SQLITE_INTERRUPT) {
            cancelled++;
            resolve();
          } else {
            reject();
          }
        }
      });
    };

    const queries = [];
    for (let i = 0; i < 20; i++) {
      queries.push(cb());
    }
    await Promise.all(queries);
    // We expect at least one query to be cancelled
    assert.isAtLeast(cancelled, 1);
    assert.isAtLeast(successful, 1);
    assert.isAtLeast(rowCount, 1);
  });

  it("Paging Results", async () => {
    const getRowPerPage = (nPageSize: number, nRowCount: number) => {
      const nRowPerPage = nRowCount / nPageSize;
      const nPages = Math.ceil(nRowPerPage);
      const nRowOnLastPage = nRowCount - (Math.floor(nRowPerPage) * pageSize);
      const pages = new Array(nPages).fill(pageSize);
      if (nRowPerPage) {
        pages[nPages - 1] = nRowOnLastPage;
      }
      return pages;
    };

    const pageSize = 5;
    const query = "SELECT ECInstanceId as Id, Parent.Id as ParentId FROM BisCore.element";
    const dbs = [imodel1, imodel2, imodel3, imodel4, imodel5];
    const pendingRowCount = [];
    for (const db of dbs) {
      pendingRowCount.push(db.queryRowCount(query));
    }

    const rowCounts = await Promise.all(pendingRowCount);
    const expected = [46, 62, 7, 7, 28];
    assert.equal(rowCounts.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
      assert.equal(rowCounts[i], expected[i]);
    }
    // verify row per page
    for (const db of dbs) {
      const i = dbs.indexOf(db);
      const rowPerPage = getRowPerPage(pageSize, expected[i]);
      for (let k = 0; k < rowPerPage.length; k++) {
        const rs = await db.queryRows(query, undefined, { maxRowAllowed: pageSize, startRowOffset: k * pageSize });
        assert.equal(rs.rows.length, rowPerPage[k]);
      }
    }

    // verify async iterator
    for (const db of dbs) {
      const resultSet = [];
      for await (const row of db.query(query)) {
        resultSet.push(row);
        assert.isTrue(Reflect.has(row, "id"));
        if (Reflect.ownKeys(row).length > 1) {
          assert.isTrue(Reflect.has(row, "parentId"));
          const parentId: string = row.parentId;
          assert.isTrue(Id64.isValidId64(parentId));
        }
        const id: string = row.id;
        assert.isTrue(Id64.isValidId64(id));
      }
      const entry = dbs.indexOf(db);
      assert.equal(rowCounts[entry], resultSet.length);
    }
  });
});
