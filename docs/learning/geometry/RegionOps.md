
# Examples of `RegionOps`

## RegionOps.splitPathsByRegionInOnOutXY

|  |  |
|---|---|
| 25 points | ![>](./figs/RegionOps/splitPathsByRegionInOnOutXY/InOutSplitsInput.png) |
| split the black path into parts inside and outside the grey area | `     const splitParts = RegionOps.splitPathsByRegionInOnOutXY(path, loop);`|
| (red) Path parts "inside" the region <br>  `splitParts.insideParts`| ![>](./figs/RegionOps/splitPathsByRegionInOnOutXY/InOutSplitsInsidePart.png) |
| (green) Path parts "outside" the region  <br>  `splitParts.outsideParts`| ![>](./figs/RegionOps/splitPathsByRegionInOnOutXY/InOutSplitsOutsidePart.png) |

### Remarks

Using a closed region as the cutter is a specialized high level operation, just one of the many ways that splitting may be needed.  It is a combination of

|  |  |
|---|---|
| a _split_ step uses the region boundary curves but not the interior/exterior properties. |`const splitPaths = RegionOps.splitToPathsBetweenFlagBreaks ((pathWithIntersectionMarkup, true);` |
| a _classification_ step tests one point from each fragment of the `splitPaths`: | |
| (a) obtain one point on a fragment being tested |`const pointOnChild = CurveCollection.createCurveLocationDetailOnAnyCurvePrimitive(splitPaths);` |
| (b) determine if that single point is inside or outside. <br> since the fragments have no interior crossings, that point classifies the whole fragment | `const inOnOut = RegionOps.testPointInOnOutRegionXY(region, pointOnChild.point.x, pointOnChild.point.y);` |



Unit Test
  * source: imodeljs\core\geometry\src\test\topology\RegionOps.test.ts
  * test name: "InOutSplits"
  * output: imodeljs\core\geometry\src\test\output\RegionOps\InOutSplits.imjs