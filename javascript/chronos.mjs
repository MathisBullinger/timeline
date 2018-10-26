/*
 ██████ ██   ██ ██████   ██████  ███    ██  ██████  ███████
██      ██   ██ ██   ██ ██    ██ ████   ██ ██    ██ ██
██      ███████ ██████  ██    ██ ██ ██  ██ ██    ██ ███████
██      ██   ██ ██   ██ ██    ██ ██  ██ ██ ██    ██      ██
 ██████ ██   ██ ██   ██  ██████  ██   ████  ██████  ███████
*/

export { chronos };

//
// Date
//
class _Date {
  constructor(year, month, day) {
    this._year = year;
    this.month = month;
    this.day = day;

    //
    // Gregorian
    //
    this.gregorian = new class DateGregorian {
      constructor(year) {
        this.year = year;
        this._date = undefined;
      }
      toString() {
        return `${this._date._toStringDayMonth()} ${this._date._year<1200 ? this.year : this.year.split(' ')[0] }`;
      }
    } (this._year > 0 ? this._year + ' AD' : this._year * -1 + ' BC');

    //
    // Holocene
    //
    this.holocene = new class DateHolocene {
      constructor(year) {
        this.year = year;
        this._date = undefined;
      }
      toString() {
        return `${this._date._toStringDayMonth()} ${this.year.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
      }
    } (this._year + 10000);

    this.gregorian._date = this;
    this.holocene._date = this;
  }

  // to string (day & month)
  _toStringDayMonth() {
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return this.month>0 && this.month<=12 ? `${ this.day > 0 ? this.day : ''}. ` + months[this.month + 1] : '';
  }

  // get & set year
  get year() { return this._year; }
  set year(value) {
    this._year = value;
    this.gregorian.year = this._year > 0 ? this._year + ' AD' : this._year * -1 + ' BC';
    this.holocene.year = this._year + 10000;
  }
}

//
// Timepoint
//
class _Timepoint {
  constructor(name, date) {
    this.date = date;
    this.name = name;
  }
}

//
// Namespace
//
const chronos = {
  Date: _Date,
  Timepoint: _Timepoint
}
