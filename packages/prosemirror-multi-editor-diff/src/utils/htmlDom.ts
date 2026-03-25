export const oneIteration = (
  consumedArr: HTMLElement[],
  siblingFilter: (element: Element) => boolean = () => true,
  accArray: HTMLElement[] = [],
  hadChange: boolean = false
): { elements: HTMLElement[]; hadChange: boolean } => {
  if (consumedArr.length > 0) {
    const mainElement = consumedArr[0];
    const mainParent = mainElement.parentElement;
    if (mainParent === null) {
      return oneIteration(
        consumedArr.slice(1),
        siblingFilter,
        [...accArray, mainElement],
        hadChange
      );
    }
    const mainParentChildren = Array.from(mainParent.children).filter(
      siblingFilter
    ) as HTMLElement[];
    if (mainParentChildren.length === 1) {
      //easy mode, we just change the main node with its parent
      return oneIteration(
        consumedArr.slice(1),
        siblingFilter,
        [...accArray, mainParent],
        true
      );
    } else {
      // hard mode, we need to check if we can merge the main node with its siblings
      const mainParentChildrenFoundInConsumed = consumedArr.filter(
        (element) => {
          return mainParentChildren.includes(element);
        }
      );
      if (
        mainParentChildrenFoundInConsumed.length === mainParentChildren.length
      ) {
        // we can merge all the children of the main parent
        return oneIteration(
          consumedArr.filter((element) => {
            !mainParentChildren.includes(element);
          }),
          siblingFilter,
          [...accArray, mainParent],
          true
        );
      } else {
        // we can't merge all the children of the main parent
        return oneIteration(
          consumedArr.slice(1),
          siblingFilter,
          [...accArray, mainElement],
          hadChange
        );
      }
    }
  } else {
    return { elements: accArray, hadChange };
  }
};

export const mergeUpNodesWithParents = (
  nodes: HTMLElement[],
  siblingFilter: (element: Element) => boolean = () => true
): HTMLElement[] => {
  const { elements, hadChange } = oneIteration(nodes, siblingFilter);
  if (hadChange) {
    return mergeUpNodesWithParents(elements, siblingFilter);
  } else {
    return elements;
  }
};
