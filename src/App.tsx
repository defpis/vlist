import "./App.css";
import { VariableSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce, omit, range } from "lodash-es";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { injectCss, ROW_CONTAINER_CLASS } from "./patch";

const useUpdate = () => {
  const [updateId, setUpdateId] = useState<number>(0);

  const update = useMemo(
    () =>
      debounce(() => {
        setUpdateId((id) => (id + 1) % 1000);
      }, 100),
    []
  );

  return { updateId, update };
};

const Term = (props: any) => {
  const { content, termRef } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const { xterm } = termRef.current;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !xterm) return;

    container.style.width = "100%";
    container.style.backgroundColor = "#1A1A1A";
    container.style.color = "#E0E0E0";
    container.style.fontFamily = "Menlo";
    container.style.fontSize = "12px";
    container.style.fontWeight = "normal";

    xterm.reset();

    const classPrefix = "xterm-custom";
    container.className = classPrefix;

    const core = xterm._core;
    const renderer = core._renderService._renderer.value;
    const { buffer } = renderer._bufferService;

    const themeStyleElement = injectCss(renderer, classPrefix);

    core.writeSync(content);

    const rowElement = document.createElement("div");
    rowElement.className = ROW_CONTAINER_CLASS;

    for (let i = 0; i < buffer.lines.length; i++) {
      const lineData = buffer.lines.get(i);
      if (lineData?.translateToString().trim()) {
        const row = document.createElement("div");

        // src/browser/renderer/dom/DomRenderer.ts
        row.style.width = `${renderer.dimensions.css.canvas.width}px`;
        row.style.height = `${renderer.dimensions.css.cell.height}px`;
        row.style.lineHeight = `${renderer.dimensions.css.cell.height}px`;
        // Make sure rows don't overflow onto following row
        row.style.overflow = "hidden";

        row.replaceChildren(
          ...renderer._rowFactory.createRow(
            lineData,
            row,
            false,
            "block",
            "block",
            0,
            false,
            renderer.dimensions.css.cell.width,
            renderer._widthCache,
            -1,
            -1
          )
        );

        rowElement.appendChild(row);
      }
    }

    container.replaceChildren(themeStyleElement, rowElement);
  }, [content, xterm]);

  return <div ref={containerRef}></div>;
};

const RenderBlock = ({ index, style, data }: any) => {
  const { renderItems, changeHeight, termRef } = data;

  const ref = useRef<any>(null);
  const { updateId, update } = useUpdate();

  const sizeRef = useRef<{ width: number; height: number }>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ob = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const size = sizeRef.current;

      // 避免死循环
      if (size?.width === rect.width && size?.height === rect.height) return;
      sizeRef.current = { width: rect.width, height: rect.height };

      changeHeight(index, rect.height);
      update();
    });
    ob.observe(ref.current);

    return () => ob.disconnect();
  }, [changeHeight, index, update]);

  const restStyle = omit(style, "height");

  return (
    <div ref={ref} className="item" style={restStyle}>
      <div>Id: {renderItems[index].id}</div>
      <Term
        key={updateId}
        content={renderItems[index].content}
        termRef={termRef}
      ></Term>
    </div>
  );
};

const RenderSpace = ({ index, style, data }: any) => {
  const { changeSpace, containerHeight } = data;

  useEffect(() => {
    changeSpace(index, containerHeight);
  }, [changeSpace, containerHeight, index]);

  return <div style={style}></div>;
};

const RenderItem = (props: any) => {
  if (props.index === 0) {
    return <RenderSpace {...props} />;
  }
  return <RenderBlock {...props} />;
};

// let id = 100;

export function App() {
  const listRef = useRef<any>(null);

  const [items, setItems] = useState<any[]>(
    range(1).map((i) => ({
      id: i,
      content:
        "Xterm.js is a front-end component written in TypeScript that lets applications bring fully-featured terminals to their users in the browser. It's used by popular projects such as VS Code, Hyper and Theia.",
    }))
  );

  useEffect(() => {
    fetch("/sgr-test.txt")
      .then((resp) => resp.text())
      .then((data) => {
        setItems((prev) => [
          ...prev,
          {
            id: 1,
            content: data.replace(/\n/g, "\r\n"),
          },
        ]);
      });
  }, []);

  // 测试添加内容
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     if (id === 110) {
  //       return clearInterval(timer);
  //     }

  //     id++;
  //     const repeat = (id % 2) + 1;
  //     setItems((prev) => [
  //       ...prev,
  //       {
  //         id: id,
  //         content: range(repeat)
  //           .map(
  //             () =>
  //               "Xterm.js is a front-end component written in TypeScript that lets applications bring fully-featured terminals to their users in the browser. It's used by popular projects such as VS Code, Hyper and Theia."
  //           )
  //           .join("\r\n"),
  //       },
  //     ]);
  //   }, 200);

  //   return () => {
  //     clearInterval(timer);
  //   };
  // }, []);

  const resetAfterIndex = useMemo(() => {
    const indices = new Set<number>();
    let rafId: number;

    const _resetAfterIndex = () => {
      if (!indices.size) return;
      const index = Math.min(...indices);
      listRef.current?.resetAfterIndex(index);
      indices.clear();
    };

    return (index: number) => {
      indices.add(index);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(_resetAfterIndex);
    };
  }, []);

  const [space, setSpace] = useState(0);

  const renderItems = useMemo(
    () => [{ height: space }, ...items],
    [space, items]
  );

  const changeHeight = useCallback(
    (index: number, blockHeight: number) => {
      const newItems = [...items];
      newItems[index - 1].height = blockHeight;
      setItems(newItems);
      resetAfterIndex(index);
    },
    [items, resetAfterIndex]
  );

  const changeSpace = useCallback(
    (index: number, containerHeight: number) => {
      const totalHeight = items.reduce(
        (acc: any, cur: any) => acc + (cur.height || 0),
        0
      );
      const newHeight = Math.max(0, containerHeight - totalHeight);
      setSpace(newHeight);
      resetAfterIndex(index);
    },
    [items, resetAfterIndex]
  );

  const xtermRef = useRef<any>(null);
  const termRef = useRef<any>(null);

  useEffect(() => {
    if (!xtermRef.current || termRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      drawBoldTextInBrightColors: true,
      rightClickSelectsWord: false,
      fontFamily: "Menlo",
      fontSize: 12,
      fontWeight: "normal",
      fontWeightBold: "bold",
      lineHeight: 1,
      theme: {
        background: "#1A1A1A",
        foreground: "#E0E0E0",
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(xtermRef.current);
    fitAddon.fit();

    const ob = new ResizeObserver(() => {
      fitAddon.fit();
    });
    ob.observe(xtermRef.current);

    termRef.current = {
      xterm,
      fitAddon,
    };
  }, []);

  return (
    <>
      <div className="app">
        <div className="xterm" ref={xtermRef}></div>
        <AutoSizer>
          {({ width, height }) => (
            <VariableSizeList
              className="list"
              ref={listRef}
              width={width}
              height={height}
              itemCount={renderItems.length}
              itemSize={(index: number) => renderItems[index]?.height || 0}
              itemData={{
                changeHeight,
                changeSpace,
                renderItems,
                containerHeight: height,
                termRef,
              }}
            >
              {RenderItem}
            </VariableSizeList>
          )}
        </AutoSizer>
      </div>
    </>
  );
}
