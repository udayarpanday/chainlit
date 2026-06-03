let activeTaskCount = 0;
let ignoredTaskEndCount = 0;

const isTaskLoading = () => activeTaskCount > 0;

const resetTaskLoading = () => {
  activeTaskCount = 0;
  ignoredTaskEndCount = 0;
  return false;
};

const markTaskStarted = () => {
  activeTaskCount += 1;
  return true;
};

const markTaskEnded = () => {
  if (ignoredTaskEndCount > 0) {
    ignoredTaskEndCount -= 1;
    return isTaskLoading();
  }

  activeTaskCount = Math.max(0, activeTaskCount - 1);
  return isTaskLoading();
};

const markTaskStopped = () => {
  if (activeTaskCount > 0) {
    activeTaskCount -= 1;
    ignoredTaskEndCount += 1;
  }

  return isTaskLoading();
};

export { markTaskEnded, markTaskStarted, markTaskStopped, resetTaskLoading };
