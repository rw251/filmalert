const my = {

  /**
   * Executed when DOM is ready
   * @param {function} callback To call on DOM ready
   * @returns {void}
   */
  ready(callback) {
    // in case the document is already rendered
    if (document.readyState !== 'loading') callback();
    // modern browsers
    else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
    // IE <= 8
    else {
      document.attachEvent('onreadystatechange', () => {
        if (document.readyState === 'complete') callback();
      });
    }
  },

  /**
   * Makes an ajax get
   * @param {string} url The url to get
   * @param {function} callback The callback on completion
   * @returns {void}
   */
  get(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = () => {
      callback(null, JSON.parse(xhr.responseText));
    };
    xhr.onabort = () => {
      callback(new Error('aborted'));
    };
    xhr.onerror = () => {
      callback(new Error('error'));
    };
    xhr.send();
  },

  /**
   * Makes an ajax post
   * @param {string} url The url to post to
   * @param {Object} data The data to post as a js object
   * @param {function} callback The callback on completion
   * @returns {void}
   */
  post(url, data, callback) {
    let xhr = new XMLHttpRequest();
    if (!('withCredentials' in xhr)) xhr = new XDomainRequest(); // fix IE8/9
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = () => {
      callback(null, JSON.parse(xhr.responseText));
    };
    xhr.onabort = () => {
      callback(new Error('aborted'));
    };
    xhr.onerror = () => {
      callback(new Error('error'));
    };
    const body = Object.keys(data).map(key => `${key}=${data[key]}`).join('&');
    xhr.send(body);
  },
};

/**
 * @class my
 */
class My {
  /**
   * @param {string} idSelector Id selector for element
   */
  constructor(idSelector) {
    this.element = document.getElementById(idSelector);
  }

  /**
   * Hides the element
   * @returns {void}
   */
  hide() {
    this.element.style.display = 'none';
  }

  /**
   * Shows the element
   * @param {string} block Sometimes need this for already hidden block elements like divs
   * @returns {void}
   */
  show(block) {
    this.element.style.display = block ? 'block' : '';
  }

  /**
   * Sets the elements inner html
   * @param {string} html The HTML to insert
   * @returns {void}
   */
  html(html) {
    this.element.innerHTML = html;
  }

  /**
   * Attach event listener
   * @param {string} event Event to listen for
   * @param {function} callback Run this on event fired
   * @returns {void}
   */
  on(event, callback) {
    this.element.addEventListener(event, callback);
  }

  /**
   * @returns {string} The input value
   */
  val() {
    return this.element.value;
  }

  /**
   * Simulate a click on an element
   * @returns {void}
   */
  click() {
    this.element.click();
  }

  /**
   * Adds the class
   * @param {string} className Classname to add
   * @returns {void}
   */
  addClass(className) {
    if (this.element.classList) {
      this.element.classList.add(className);
    } else {
      this.element.className += ` ${className}`;
    }
  }

  /**
   * Removes a class
   * @param {string} className Classname to add
   * @returns {void}
   */
  removeClass(className) {
    if (this.element.classList) {
      this.element.classList.remove(className);
    } else {
      this.element.className = this.element.className.replace(new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), ' ');
    }
  }

  /**
   * Checks if element has a class
   * @param {string} className The class name to check
   * @returns {boolean} Whether class name is found
   */
  hasClass(className) {
    if (this.element.classList) {
      return this.element.classList.contains(className);
    }
    return new RegExp(`(^| )${className}( |$)`, 'gi').test(this.element.className);
  }

  /**
   * Gives focus to the element
   * @returns {void}
   */
  focus() {
    this.element.focus();
  }
}

const init = idSelector => new My(idSelector);

init.post = my.post;
init.get = my.get;
init.ready = my.ready;

module.exports = init;
