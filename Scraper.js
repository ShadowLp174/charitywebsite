const fetch = require("node-fetch");
const JSDOM = require("jsdom").JSDOM;

class Scraper {
  constructor() {
    this.url = "https://www.justgiving.com/crowdfunding/kings-channel-swim";
    this.elem = ".jg-text--brand-large._24ROb";
    this.supporter = ".msXxp";

    return this;
  }
  scrape() {
    return new Promise((res, rej) => {
      fetch(this.url).then(res => res.text()).then(txt => {
        const { document } = (new JSDOM(txt)).window;
        const value = document.querySelector(this.elem).innerHTML;
        const supporterBox =  document.querySelector(this.supporter).children[0];
        const supporter = supporterBox.children[1].children[0].innerHTML.split(" ")[0];
        const goal = supporterBox.children[0].children[0].innerHTML;
        res({ raised: value, supporter: supporter, goal: goal });
      }).catch(err => {
        console.log(err);
      });
    });
  }
}

module.exports = Scraper;
