import { TextSelection } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";
import { imagePluginClassNames, ImagePluginSettings } from "../types";
import createResizeControls from "./resize/createResizeControls";
import getImageDimensions from "./resize/getImageDimensions";
import getMaxWidth from "./resize/getMaxWidth";
import calculateImageDimensions from "./resize/calculateImageDimensions";

const getSrc = (
  image: HTMLImageElement,
  pluginSettings: ImagePluginSettings,
  node: Node,
  root: Element,
  view: EditorView
): { newSrc: Promise<string>; appliedClass?: string } => {
  if (pluginSettings.downloadImage) {
    let appliedClass;
    if (pluginSettings.downloadPlaceholder) {
      if (
        pluginSettings.enableResize &&
        node.attrs.width &&
        node.attrs.height
      ) {
        const maxWidth = getMaxWidth(root, pluginSettings);
        const finalDimensions = calculateImageDimensions(
          maxWidth,
          maxWidth,
          node.attrs.width,
          node.attrs.height,
          pluginSettings,
          node.attrs.width,
          node.attrs.height
        );
        // eslint-disable-next-line no-param-reassign
        image.style.height = `${finalDimensions.height}px`;
        // eslint-disable-next-line no-param-reassign
        image.style.width = `${finalDimensions.width}px`;
      }
      const placeholder = pluginSettings.downloadPlaceholder(
        node.attrs.src,
        view
      );
      if (typeof placeholder === "string") {
        // eslint-disable-next-line no-param-reassign
        image.src = placeholder;
      } else if (typeof placeholder === "object") {
        if ("src" in placeholder && typeof placeholder.src === "string") {
          // eslint-disable-next-line no-param-reassign
          image.src = placeholder.src;
        }
        if (
          "className" in placeholder &&
          typeof placeholder.className === "string"
        ) {
          appliedClass = placeholder.className;
          // eslint-disable-next-line no-param-reassign
          image.className = `${image.className} ${appliedClass}`;
        }
      }
    }
    return {
      newSrc: pluginSettings.downloadImage(node.attrs.src),
      appliedClass,
    };
  }
  return { newSrc: node.attrs.src };
};

const imageNodeView =
  (pluginSettings: ImagePluginSettings) =>
  (
    node: Node,
    view: EditorView,
    getPos: () => number | undefined
  ): NodeView => {
    let finalSrc: string | undefined;
    const root = document.createElement("div");
    root.className = imagePluginClassNames.imagePluginRoot;
    const image = document.createElement("img");
    image.className = imagePluginClassNames.imagePluginImg;
    image.contentEditable = "false";
    let resizeActive = false;
    const setResizeActive = (value: boolean) => {
      resizeActive = value;
    };
    root.appendChild(image);
    let dimensions:
      | { width: number; height: number; completed: boolean }
      | undefined;
    Object.keys(node.attrs).map((key) =>
      root.setAttribute(`imageplugin-${key}`, node.attrs[key])
    );
    const contentDOM = pluginSettings.hasTitle && document.createElement("div");
    if (contentDOM) {
      contentDOM.className = "imagePluginContent";
      // Handle contentDOM
      contentDOM.addEventListener("click", (e) => {
        const pos = getPos();
        if (!pos || contentDOM.innerText.length > 1) {
          return;
        }
        e.preventDefault();
        view.dispatch(
          view.state.tr.setSelection(
            TextSelection.near(view.state.doc.resolve(pos + 1))
          )
        );
        view.focus();
      });
      contentDOM.className = "text";
      root.appendChild(contentDOM);
    }

    const overlay = pluginSettings.createOverlay(node, getPos, view);
    if (overlay) {
      root.appendChild(overlay);
      pluginSettings.updateOverlay(overlay, getPos, view, node);
    }

    image.alt = node.attrs.alt;
    let resizeControls: HTMLDivElement | undefined;
    const updateDOM = () => {
      if (resizeActive) {
        return;
      }

      const pos = getPos();
      if (!pos || (pluginSettings.enableResize && !dimensions)) {
        return;
      }

      const updatedNode = view.state.doc.nodeAt(pos);

      if (!updatedNode) {
        return;
      }

      Object.keys(updatedNode.attrs).map((attr) =>
        root.setAttribute(`imageplugin-${attr}`, updatedNode.attrs[attr])
      );

      if (pluginSettings.enableResize && dimensions) {
        const maxWidth = getMaxWidth(root, pluginSettings);
        const finalDimensions = calculateImageDimensions(
          maxWidth,
          maxWidth,
          dimensions.width,
          dimensions.height,
          pluginSettings,
          updatedNode.attrs.width,
          updatedNode.attrs.height,
          updatedNode.attrs.maxWidth
        );
        image.style.height = `${finalDimensions.height}px`;
        image.style.width = `${finalDimensions.width}px`;
        if (resizeControls) {
          resizeControls.remove();
        }
        resizeControls = createResizeControls(
          finalDimensions.height,
          finalDimensions.width,
          getPos,
          updatedNode,
          view,
          image,
          setResizeActive,
          maxWidth,
          pluginSettings
        );
        root.appendChild(resizeControls);
      }
    };
    let unsubscribeResizeObserver: (() => void) | undefined;
    (async () => {
      updateDOM(); // we set the w/h before we download the image if we know them
      const { newSrc, appliedClass } = getSrc(
        image,
        pluginSettings,
        node,
        root,
        view
      );
      finalSrc = await newSrc;
      if (appliedClass) {
        image.className = image.className
          .split(" ")
          .filter((c: string) => c !== appliedClass)
          .join(" ");
      }
      if (pluginSettings.enableResize) {
        dimensions = await getImageDimensions(finalSrc);
        const hasDimensions = dimensions?.width && dimensions?.height;
        const shouldUpdateInitialDimensions =
          hasDimensions &&
          !(node.attrs.width && node.attrs.height && node.attrs.maxWidth);
        if (shouldUpdateInitialDimensions) {
          const pos = getPos();
          if (pos) {
            const maxWidth = getMaxWidth(root, pluginSettings);
            const attrs = {
              ...node.attrs,
              width: dimensions.width,
              height: dimensions.height,
              maxWidth,
            };
            const tr = view.state.tr.setNodeMarkup(pos, undefined, attrs);
            view.dispatch(tr);
          }
        }
      }
      image.src = finalSrc;
      updateDOM();
      const parent = root.parentElement;
      if (!parent || !pluginSettings.enableResize) return;
      unsubscribeResizeObserver = pluginSettings.resizeCallback(
        parent,
        updateDOM
      );
    })();
    return {
      ...(contentDOM
        ? {
            contentDOM,
            stopEvent: (e: Event) => e.target === contentDOM,
            selectable: true,
            content: "text*",
          }
        : {}),
      dom: root,
      update: (updateNode: Node) => {
        if (updateNode.type.name !== "image" || !finalSrc) {
          return false;
        }
        if (overlay)
          pluginSettings.updateOverlay(overlay, getPos, view, updateNode);
        updateDOM();
        return true;
      },
      ignoreMutation: () => true,
      destroy: () => {
        unsubscribeResizeObserver?.();
        pluginSettings.deleteSrc(node.attrs.src);
      },
    };
  };

export default imageNodeView;
