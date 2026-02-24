import { Routes, Route, Link, Outlet } from "react-router-dom";
import styled from "styled-components";

import { ProsemirrorEditor } from "./ProsemirrorEditor";
import {ProsemirrorEditorInfiniteLoad} from "./ProsemirrorEditorInfiniteLoad";

const Root = styled.div`
  display: flex;
  flex-direction: column;
  flex-gap: 1rem;
`;

const Navigation = styled.nav`
  padding: 0.5rem;
  display: flex;
  flex-direction: row;
  gap: 1rem;
`;

export const Item = styled.button`
  align-items: center;
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.25rem;
  box-shadow: rgba(0, 0, 0, 0.02) 0 1px 3px 0;
  box-sizing: border-box;
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  display: inline-flex;
  font-family:
    system-ui,
    -apple-system,
    system-ui,
    "Helvetica Neue",
    Helvetica,
    Arial,
    sans-serif;
  font-size: 16px;
  font-weight: 600;
  justify-content: center;
  line-height: 1.25;
  margin: 0;
  min-height: 3rem;
  padding: calc(0.875rem - 1px) calc(1.5rem - 1px);
  position: relative;
  text-decoration: none;
  transition: all 250ms;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  vertical-align: baseline;
  width: auto;

  :hover,
  :focus {
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: rgba(0, 0, 0, 0.1) 0 4px 12px;
    color: rgba(0, 0, 0, 0.65);
  }

  :hover {
    transform: translateY(-1px);
  }

  :active {
    background-color: #f0f0f1;
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: rgba(0, 0, 0, 0.06) 0 2px 4px;
    color: rgba(0, 0, 0, 0.65);
    transform: translateY(0);
  }
`;

const LP = () => {
    return (
        <Root>
            {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
            <Navigation>
                <Item>
                    <Link to="/">LP</Link>
                </Item>
                <Item>
                    <Link to="/prosemirror">Prosemirror</Link>
                </Item>
                <Item>
                    <Link to="/prosemirror2">Prosemirror Infinite Load</Link>
                </Item>
            </Navigation>

            <hr />

            {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
            <Outlet />
        </Root>
    );
};

export const Main = () => {
    return (
        <Routes>
            <Route path="/" element={<LP />}>
                <Route path="/prosemirror" element={<ProsemirrorEditor />} />
                <Route path="/prosemirror2" element={<ProsemirrorEditorInfiniteLoad />} />
            </Route>
        </Routes>
    );
};