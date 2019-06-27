  /**
* Execute a function given a delay time
* 
* @param {type} func
* @param {type} wait
* @param {type} immediate
* @returns {Function}
*/
const debounce = (func, wait, immediate) => {
  let timeout;
  return function bouncy(...args) {
    const context = this; 
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

// Taken from https://stackoverflow.com/a/2117523/596639
const uuidv4 = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

export { debounce, uuidv4 };