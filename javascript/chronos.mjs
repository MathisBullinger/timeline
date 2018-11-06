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
        // remove BC/AD after 1200
        let str_daymonth = this._date._toStringDayMonth();
        if (str_daymonth != '')
          str_daymonth += ' ';
        return `${str_daymonth}${this._date._year<1200 ? this.year : this.year.split(' ')[0] }`;
      }
      // force BC/AD indicator after date
      toStringBCAD() {
        return `${this._date._toStringDayMonth()} ${this.year}`;
      }
    } (this._year > 0 ? Math.round(this._year) + ' AD' : Math.round(this._year * -1) + ' BC');

    //
    // Holocene
    //
    this.holocene = new class DateHolocene {
      constructor(year) {
        this.year = year;
        this._date = undefined;
      }
      toString() {
        let str_daymonth = this._date._toStringDayMonth();
        if (str_daymonth != '')
          str_daymonth += ' ';
        // e.g. 12500 => '12,500'
        return `${str_daymonth}${Math.floor(this.year).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
      }
    } (this._year + 10000);

    this.gregorian._date = this;
    this.holocene._date = this;
  }

  // round
  roundToYear() {
    return new _Date(Math.floor(this.year));
  }
  roundToDecade() {
    return new _Date( Math.floor(this.year / 10) * 10 )
  }
  roundToCentury() {
    return new _Date( Math.floor(this.year / 100) * 100 )
  }

  // to string (day & month)
  _toStringDayMonth() {
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return this.month>0 && this.month<=12 ? `${ this.day > 0 ? this.day : ''}. ` + months[this.month - 1] : '';
  }

  toStringType(date_type) {
    return date_type.toLowerCase() == 'gregorian' ? this.gregorian.toString() : this.holocene.toString();
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
  constructor(name, date, wiki_ref) {
    this.date = date;
    this.name = name;
    this.wiki_ref = wiki_ref;
  }
}

//
// Namespace
//
const chronos = {
  Date: _Date,
  Timepoint: _Timepoint
}
