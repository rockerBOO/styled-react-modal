import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";
import { Consumer } from "./context";

function Modal({
  WrapperComponent,
  children,
  onBackgroundClick,
  onEscapeKeydown,
  allowScroll,
  beforeOpen,
  afterOpen,
  beforeClose,
  afterClose,
  backgroundProps,
  isOpen: isOpenProp,
  ...rest
}) {
  const node = useRef(null);
  const prevBodyOverflowStyle = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const onEscapeKeydownCallback = useCallback(onEscapeKeydown);
  const onBackgroundClickCallback = useCallback(onBackgroundClick);
  const beforeOpenCallback = useCallback(beforeOpen);
  const afterOpenCallback = useCallback(afterOpen);
  const beforeCloseCallback = useCallback(beforeClose);
  const afterCloseCallback = useCallback(afterClose);

  // Handle changing isOpen state and deal with *before* isOpen change
  // callbacks
  useEffect(() => {
    if (isOpen !== isOpenProp) {
      if (isOpenProp) {
        if (beforeOpenCallback) {
          try {
            beforeOpenCallback().then(() => setIsOpen(isOpenProp));
            return;
          } catch (e) {
            setIsOpen(isOpenProp);
          }
        } else {
          setIsOpen(isOpenProp);
        }
      } else {
        if (beforeCloseCallback) {
          try {
            beforeCloseCallback().then(() => setIsOpen(isOpenProp));
            return;
          } catch (e) {
            setIsOpen(isOpenProp);
          }
        } else {
          setIsOpen(isOpenProp);
        }
      }
    }
  }, [isOpen, setIsOpen, isOpenProp, beforeOpenCallback, beforeCloseCallback]);

  // Handle *after* isOpen change callbacks
  useEffect(() => {
    if (isOpen) {
      afterOpenCallback && afterOpenCallback();
    } else {
      afterCloseCallback && afterCloseCallback();
    }
  }, [isOpen, afterOpenCallback, afterCloseCallback]);

  // Handle ESC keydown
  useEffect(() => {
    function handleKeydown(e) {
      if (e.key === "Escape") {
        onEscapeKeydownCallback && onEscapeKeydownCallback(e);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeydown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen, onEscapeKeydownCallback, afterOpenCallback]);

  // Handle changing document.body styles based on isOpen state
  useEffect(() => {
    if (isOpen && !allowScroll) {
      prevBodyOverflowStyle.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (!allowScroll) {
        document.body.style.overflow = prevBodyOverflowStyle.current || "";
      }
    };
  }, [isOpen, allowScroll]);

  function handleBackgroundClick(e) {
    if (node.current === e.target) {
      onBackgroundClickCallback && onBackgroundClickCallback(e);
    }
  }

  // Rendering stuff
  let content;
  if (WrapperComponent) {
    content = <WrapperComponent {...rest}>{children}</WrapperComponent>;
  } else {
    content = children;
  }

  return (
    <Consumer>
      {({ modalNode, BackgroundComponent }) => {
        if (modalNode && BackgroundComponent && isOpen) {
          return ReactDOM.createPortal(
            <BackgroundComponent
              {...backgroundProps}
              onClick={handleBackgroundClick}
              ref={node}
            >
              {content}
            </BackgroundComponent>,
            modalNode
          );
        } else {
          return null;
        }
      }}
    </Consumer>
  );
}

Modal.styled = function(...args) {
  const styles =
    styled.div`
      ${css(...args)}
    ` || styled.div``;
  return function(props) {
    return <Modal WrapperComponent={styles} {...props} />;
  };
};

Modal.defaultProps = {
  backgroundProps: {}
};

export default Modal;
