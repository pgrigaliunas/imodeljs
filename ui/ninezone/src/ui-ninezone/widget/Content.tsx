/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @module Widget */

import * as React from "react";
import { assert } from "../base/assert";
import { useTransientState } from "./ContentRenderer";
import { Point } from "@bentley/ui-core";
import "./Content.scss";

/** @internal */
export const WidgetContentComponent = React.memo(function WidgetContentComponent(props: { children?: React.ReactNode }) { // tslint:disable-line: no-shadowed-variable variable-name
  const scrollPosition = React.useRef(new Point());
  const ref = React.useRef<HTMLDivElement>(null);
  const onSave = React.useCallback(() => {
    assert(ref.current);
    scrollPosition.current = new Point(ref.current.scrollLeft, ref.current.scrollTop);
  }, []);
  const onRestore = React.useCallback(() => {
    assert(ref.current);
    ref.current.scrollLeft = scrollPosition.current.x;
    ref.current.scrollTop = scrollPosition.current.y;
  }, []);
  useTransientState(onSave, onRestore);
  return (
    <div
      className="nz-widget-content"
      ref={ref}
    >
      {props.children}
    </div>
  );
});
