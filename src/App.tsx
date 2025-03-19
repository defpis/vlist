import "./App.css";
import { VariableSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  forwardRef,
  useCallback,
} from "react";
import { range, toNumber } from "lodash-es";

const StickyListContext = createContext({});

const renderInnerElementType = (items: any[]) =>
  forwardRef(({ children, ...rest }: any, ref) => (
    <StickyListContext.Consumer>
      {({ stickyIndex, stickyOffset }: any) => (
        <div ref={ref} {...rest}>
          <div className="item sticky" style={{ top: stickyOffset }}>
            Id: {items[stickyIndex].id}
          </div>

          {children}
        </div>
      )}
    </StickyListContext.Consumer>
  ));

const renderItems =
  (items: any[], resetAfterIndex: any) =>
  ({ index, style }: any) => {
    const ref = useRef<any>(null);

    useEffect(() => {
      if (!ref.current) return;

      const ob = new ResizeObserver((entries) => {
        items[index].height = entries[0].contentRect.height;
        resetAfterIndex(index);
      });
      ob.observe(ref.current);

      return () => ob.disconnect();
    }, [index]);

    const { height, ...restStyle } = style;

    return (
      <div ref={ref} className="item" x-data-index={index} style={restStyle}>
        <div>Id: {items[index].id}</div>
        <div>Content: {items[index].content}</div>
      </div>
    );
  };

export function App() {
  const listRef = useRef<any>(null);

  const [items, setItems] = useState<any[]>(
    range(1000).map((i) => ({
      id: i,
      content:
        "Xterm.js is a front-end component written in TypeScript that lets applications bring fully-featured terminals to their users in the browser. It's used by popular projects such as VS Code, Hyper and Theia.",
    })),
  );

  const [stickyIndex, setStickyIndex] = useState(0);
  const [stickyOffset, setStickyOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const listElement = listRef.current._outerRef;
    const listRect = listElement.getBoundingClientRect();
    const itemElements = listElement.querySelectorAll(".item:not(.sticky)");
    for (let i = 0; i < itemElements.length; i++) {
      const itemElement = itemElements[i];
      const itemRect = itemElement.getBoundingClientRect();
      const relativeTop = itemRect.top - listRect.top;
      if (relativeTop < 0 && relativeTop > -itemRect.height) {
        const index = toNumber(itemElement.getAttribute("x-data-index"));
        setStickyIndex(index);

        if (i < itemElements.length - 1) {
          const itemElement = itemElements[i + 1];
          const itemRect = itemElement.getBoundingClientRect();
          const relativeTop = itemRect.top - listRect.top;
          const stickyHeight = 22;
          setStickyOffset(-Math.max(stickyHeight - relativeTop, 0));
        }

        break;
      }
    }
  }, []);

  const resetAfterIndex = useMemo(() => {
    const indices = new Set<number>();
    let rafId: number;

    const _resetAfterIndex = () => {
      if (!indices.size) return;
      const index = Math.min(...indices);
      listRef.current?.resetAfterIndex(index);
      // console.log("resetAfterIndex", JSON.stringify([...indices]), index);
      indices.clear();

      handleScroll();
    };

    return (index: number) => {
      indices.add(index);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(_resetAfterIndex);
    };
  }, [handleScroll]);

  return (
    <>
      <div className="app">
        <AutoSizer>
          {({ width, height }) => (
            <StickyListContext.Provider value={{ stickyIndex, stickyOffset }}>
              <VariableSizeList
                onScroll={handleScroll}
                innerElementType={renderInnerElementType(items)}
                className="list"
                ref={listRef}
                width={width}
                height={height}
                itemCount={items.length}
                itemSize={(index: number) => items[index]?.height || 100}
              >
                {renderItems(items, resetAfterIndex)}
              </VariableSizeList>
            </StickyListContext.Provider>
          )}
        </AutoSizer>
      </div>
    </>
  );
}
