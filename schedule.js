"use strict";

//  At this point I think I've nailed how I want the page to look, and all the PHP server scripts are
//  in place. The main thing I want to be able to do here is to consolidate all the server calls
//  to one call: in previous versions it would send a request, get the response, process the data,
//  all before moving on to the next server call. In this version, a simple for() loop sends a ton
//  of server requests in bulk, the once those are done it will actually sort through them and do the
//  processing. In the last version of this, I had converted everything to an object with methods and
//  properties... This was an attempt at doing OOP code, but it ended up being slower and was more
//  confusing to use rather than simpler. Instead, I have kept things function-based (which are objects
//  anyway), and I wanted basically to call a function and get the thing I wanted returned back.
//  In doing this I realized it was just a matter of keeping functions discreet, limiting what each
//  does to just the one thing. Therefore as long as I keep the objects that are passed to the functions
//  consistent, everything is smooth enough. 
//
//  When the page loads:
// 1.) First create a range of anchors that will provide markers for where to insert the day
// 2.) Send the server requests in bulk and store the JSON responses in an array
// 3.) Iterate through the array, convert JSON to DOM objects
// 4.) Append the DOM objects to the appropriate node that matches the date
//     (otherwise everything is out of order because of async).

//-----------------------------------
// utility functions
Date.prototype.getMySQLDate = function() {
  let d = this.getDate();
  (d < 10) ? d="0"+d : d=d;

  let m = this.getMonth()+1;
  (m < 10) ? m="0"+m : m=m;

  let y = this.getFullYear();

  let str = y + "-" + m + "-" + d;
  return str;
}

Date.prototype.moveDate = function(x) {
  let d = this.setDate(this.getDate() + parseInt(x));
  return new Date(d);
}

String.prototype.longDateFromString = function() {
  // for some reason using "-" results in the date being one day off,
  // so first it replaces - with / for YYYY/MM/DD instead of YYYY-MM-DD
  let d = this.slice(8);
  let m = this.slice(5,7);
  let y = this.slice(0, 4);
  let newD = m + "/" + d + "/" + y;
  let date = new Date(newD);
  return date.longDateFromDate();
}

Date.prototype.longDateFromDate = function() {
  let d = this.getDate();
  (d < 10) ? d="0"+d : d=d;
  
  let m = this.getMonth()+1;
  (m < 10) ? m="0"+m : m=m;
  
  let y = this.getFullYear();
  
  let weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let weekday = this.getDay();
      weekday = weekdays[weekday];
  let longdate = weekday + " " + m + "/" + d + "/" + y;
  return longdate;
}

function revertDate(str) {
  let y = str.slice(0, 4);
  let m = str.slice(5, 7);
  let d = str.slice(8, 10);
  let x = m + "/" + d + "/" + y;
  let obj = new Date(x);
  return obj;
}

const $ = function(element) {
  return document.getElementById(element);
}

//-----------------------------------
// main functions

async function Schedule(sD=0, r=20, p=0) {
  // sD = the starting day
  //  r = range, the number of days to display
  //  p = placement; where on the page to append the days (past/present/future)

  $("spinner").style.visibility = "visible";    // loading spinner
  
  // start from a timestamp or default to today's date
  var start = sD == 0 ? new Date() : new Date(sD);   
  var i = 0;

  function createAnchors() {
    return new Promise((resolve, reject) => {
      // this creates a bunch of <a> anchors that provide markers for where
      // to append the DOM content. it's to ensure that the days are laid out
      // in order, because otherwise the for() loop mixes it all up.
      // since they have no other function, they are removed after they're used
      // just to keep the number of DOM elements down a little.
      var chunk = document.createDocumentFragment();

      for (i = 0; i < r; i++) {
        let newDay = new Date(start);
            newDay = newDay.moveDate(i);
            newDay = newDay.getMySQLDate();   /// increment the date and conver it to mysql-readable format

        let main = document.createElement("a");
            main.id = newDay+"-a";

        chunk.appendChild(main);
      }
      resolve(chunk);

    })
  }

  // get all the JSON at once, store it in an unordered array
  function bulkFetchJSON() {
    return new Promise((resolve, reject) => {
      // create an array of promises that each contain a server call.
      // once the server responds, it resolves those promises, and when
      // all the promises are resolved it returns the array, which is now
      // full of DOM objects that can be appended to the page.
      let promises = [];

      for (i = 0; i < r; i++) {
        promises[i] = new Promise((resolve, reject) => {
          let newDay = new Date(start);
              newDay = newDay.moveDate(i);
              newDay = newDay.getMySQLDate();
          dayJSON(newDay).then( json => { resolve(json) } );
        })
      }
  
      Promise.all(promises).then ( a => { resolve(a) } ); 
      
    })
  }

  let chunk = await createAnchors();
  let json = await bulkFetchJSON();
  let day;
  // go through array and convert JSON to DOM
  for (day in json) {
    let dayChunk = Day(json[day]);
    // use the date contained in the JSON to append to the correct div
    let keyID = json[day][0].DAY;
    let anchor = chunk.getElementById(keyID+"-a");
    chunk.insertBefore(dayChunk, anchor.nextSibling);
    anchor.remove();    // get rid of the anchors because they're not useful anymore and i feel like it
  }

  // now append it to the DOM according to the position
  let c = document.getElementById("container");
  switch (p) {
    case 0:
      c.appendChild(chunk);
      break;
    case -1:
      c.insertBefore(chunk, c.children[0])
      break;
    case 1:
      c.insertBefore(chunk, c.lastChild.nextSibling);
      break;
  }
  $("spinner").style.visibility = "hidden";
}

function getHeaderJSON(d) { return new Promise(resolve => {
  let param = "d=" + d;
  let http = new XMLHttpRequest();    
  
  http.open("POST", "getHeader.php", true)
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      resolve(response);
      }
    }
  http.send(param);
  
})}

function getEntriesJSON(d) { return new Promise(resolve => {

  let param = "d=" + d;
  let http = new XMLHttpRequest();

  http.open("POST", "getEntries.php", true)
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      let response = http.responseText ? JSON.parse(http.responseText) : {};
      resolve(response);
    }
  }
  http.send(param);

})}

async function dayJSON(d) {
  // d = date in YYYY-MM-DD format
  let pckge = await Promise.all([getHeaderJSON(d), getEntriesJSON(d)]);
  return pckge;
}

//-----------------------------------
// set up page when DOM is loaded

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    
    // preload loading spinner
    let spinner = new Image();
    spinner.src = "spinner.gif";

    // create the initial schedule
    Schedule();

    // set up search buttons
    $("searchButton").addEventListener("click", loadSearch);
    $("searchSubmit").addEventListener("click", search);

    // set up loading buttons
    $("loadPastWeek").addEventListener("click", ()=>{
      // figure out what the first date is, increment it back by a week
      let firstDay = document.querySelector(".day").id;   // takes the first element with class "day" in the DOM
      var dateObj = new Date(firstDay);
          dateObj = dateObj.moveDate(-6);
      
      Schedule(dateObj, 7, -1)
    })
    
    $("loadPastMonth").addEventListener("click", function(){
      let firstDay = document.querySelector(".day").id;
      let dateObj = new Date(firstDay);
          dateObj = dateObj.moveDate(-28);

      Schedule(dateObj, 28, -1);
    })
    
    $("loadNextWeek").addEventListener("click", function(){
      let lastDay = $("container").lastChild.id;
      let dateObj = new Date(lastDay);
      // more date bugginess; the next day must be +2 instead of +1
          dateObj = dateObj.moveDate(2);
      Schedule(dateObj, 7, 1);
    })
    
    $("loadNextMonth").addEventListener("click", function(){
      let lastDay = document.getElementById("container").lastChild.id;
      let dateObj = new Date(lastDay);
      // more date bugginess; the next day must be +2 instead of +1
          dateObj = dateObj.moveDate(2);
      Schedule(dateObj, 28, 1);
    })

  }
}

//-----------------------------------
// header/entry utilities

function setOption() {
  let col = this.name;
      col = col.toUpperCase();
  let val = this.value;
  let d = this.classList[0].slice(0, 10);
  let param = "id=" + d + "&val=" + val + "&col=" + col;
  let http = new XMLHttpRequest();
      http.open("POST", "setOption.php", true);
      http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
          refreshDay(d);
        }
      }
      http.send(param);
}

function saveChange() {
  this.classList.remove("flagged");
  let val = this.value;
  let par = this.parentElement;
  let id  = par.id;    // the entry id
  let col = this.classList[1];
      col = col.toUpperCase();

  // toggle the background color of the status field
  if (col == "STATUS") {
    this.classList = "detail status s-" + val;
  }

  // set a custom data attribute, used for entry deletion
  if (col == "NAME") {
    par.children[7].setAttribute("data-name", val);
    par.children[7].setAttribute("data-date", par.parentElement.parentElement.id);
  }

  // push the focus to the next field for faster entry
  if (col == "STATUS" || col == "TYPE") {
    this.nextElementSibling.focus();
  }

  let param = "id=" + id + "&val=" + val + "&col=" + col;
  let http = new XMLHttpRequest();
      http.open("POST", "editEntry.php", true);
      http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      http.send(param);
}

async function refreshDay(d, c) {
  let oldDay = $(d);
  let parent = oldDay.parentElement;
  let json = await dayJSON(d);
  let newChunk = Day(json);
  parent.replaceChild(newChunk, oldDay);
}

function deleteEntry(e) {
  // create an alert box to confirm deletion
  let h = e.target.getAttribute("data-date");
      h = h.longDateFromString();
  let n = e.target.getAttribute("data-name");
  var m = "";
  n ? m = n : m = "(No name)";
  let id = e.target.parentElement.id;   // this is the auto-increment unique primary key #
  let param = "id="+id; 
  let c = confirm("Are you sure you want to delete this entry?\n\n" + m + " on " + h);
  if (c == true) {
    let http = new XMLHttpRequest();
    http.open("POST", "deleteEntry.php", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        $(id).style.display = "none";
      }
    }
    http.send(param);
  } else {
    return true;
  }
  
}

function saveNew() {

  let par = this.parentElement;   // returns the entry div

  let val = this.value;

  let d = par.parentElement.id;   // date YYYY-MM-DD
      
  let col = this.classList[1];
      col = col.toUpperCase();

  let param = "d=" + d + "&val=" + val + "&col=" + col;

  let http = new XMLHttpRequest();
      http.open("POST", "addEntry.php", true);
      http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
          refreshDay(d, http.responseText);
        }
      }.bind(this);
      http.send(param);
}

//-----------------------------------
// Search functions

function loadSearch() {
  // toggle button functions
  $("searchButton").removeEventListener("click", loadSearch);
  $("searchButton").classList.add("disabled");

  $("scheduleButton").addEventListener("click", closeSearch);
  $("scheduleButton").classList.remove("disabled");

  $("navClose").addEventListener("click", closeSearch);
  
  // display the search modal box
  $("searchModal").style.display = "block";
  $("container").style.display = "none";
}

function closeSearch() {
  $("searchButton").addEventListener("click", loadSearch);
  $("scheduleButton").removeEventListener("click", closeSearch);
  $("searchModal").style.display = "none";
  $("container").style.display = "block";
  $("searchButton").classList.remove("disabled");
  $("scheduleButton").classList.add("disabled");
}

function search() {
  
  let i = 0;
  let param = "";

  // gather data
  let q = document.querySelectorAll(".searchInput");
  let l = q.length;
  
  // make sure the form isn't totally empty and set up the request parameters
  for (i; i < l; i++) {
    if (q[i].value != "") {
      let val = q[i].value;
      let nam = q[i].classList.item(1);
          name = nam.toUpperCase();
      param += name + "=" + val + "&";
    } else {
      continue;
    }
  }

  param != "" ? submit(param) : alert("Type in something to search, dummy!");
}

function submit(param) {
  console.log("submitting");
  let p = new Promise(function(resolve, reject){
    $("spinner").style.visibility = "visible";
    // the meat of the search function here, after displaying loading spinner
    // clear out the results of the last search
    $("results").innerHTML = "";

    param = param.slice(0, param.length-1); // cut off the trailing &

    let frag = document.createDocumentFragment();
    
    // send request to server
    let http = new XMLHttpRequest();
        http.open("POST", "search.php", true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function() {
          if (http.readyState == 4 && http.status == 200) {

            // server has responded; load results if any
            let res = http.responseText;
            if (res) {
              let entries = JSON.parse(res);
              for (entry in entries) {
                let div = document.createElement("div");
                    div.classList.add("day");
  
                let e = new Entry(entries[entry]);
                let d = entries[entry].DATE;
                    d = d.longDateFromString();
                let h = document.createElement("h1");
                    h.textContent = d;
                div.appendChild(h);
                div.appendChild(e.DOMentry);
                frag.appendChild(div);
              }
              resolve(frag);
            } else {
              reject();
            }
            
          }
        }
        http.send(param);
    }).then(function(res){
      $("results").appendChild(res);
      $("spinner").style.visibility = "hidden";
    }).catch(() => {
      $("results").innerHTML = `<div class="day"><h1>No results</h1></div>`;
      $("spinner").style.visibility = "hidden";
    })
}


//-----------------------------------
// DOM objects


function Day(json) {

  let div = document.createElement("div");
      div.className = json[0].CLOSED == 1 ? "day closed" : "day";
      div.id = json[0].DAY;

  // add header
  let headerJSON = json[0];
  let header = new Header(headerJSON);
  div.appendChild(header.DOMheader);

  // add entry key header row
  let keyHeader = new entryKey();

  // add entries
  let entries = json[1];
  let entriesChunk = document.createElement("main");
      entriesChunk.appendChild(keyHeader.domKey);
  if (entries[0]) {
    let n = 1;
    let entry;
    for (entry in entries) {
      let e = new Entry(entries[entry]);
      entriesChunk.appendChild(e.DOMentry);
    } 
  }
  div.appendChild(entriesChunk);

  // add blank entry
  let blank = new blankEntry();
  div.appendChild(blank.DOMblank);

  return div;
}

function Header(json) {
  let frag = document.createDocumentFragment();
  let header = document.createElement("header");
      header.className = "options";

  let date = json.DAY;
  let longdate = date.longDateFromString();
  let notes = json.NOTES;

  let times = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"];
  let mTimes = ["0900", "0930", "1000", "1030", "1100", "1130", "1200", "1230", "1300", "1330", "1400", "1430", "1500", "1530", "1600", "1630", "1700", "1730", "1800", "1830", "1900", "1930", "2000", "2030", "2100"];

  let selectOpenTimes = "";
  for (let i = 0; i < times.length; i++) {
    selectOpenTimes += "<option value=\"" + mTimes[i] + "\" ";
    if (json.OPEN == mTimes[i]) { selectOpenTimes += "selected" };
    selectOpenTimes += ">" + times[i] + "</option>";
  }

  let selectCloseTimes = "";
  for (let i = 0; i < times.length; i++) {
    selectCloseTimes += "<option value=\"" + mTimes[i] + "\" ";
    if (json.CLOSE == mTimes[i]) { selectCloseTimes += "selected" };
    selectCloseTimes += ">" + times[i] + "</option>";
  }

  let template = `
    <div class="option-t option-item"><h1>${longdate}</h1></div>
    <div class="option-a option-item">
      <button class="${date}-option option-${json.CLOSED == 0 ? "on" : "off"}" value="0" name="CLOSED">OPEN</button>
    </div>
    <div class="option-b option-item">
      <button class="${date}-option option-${json.CLOSED == 0 ? "off" : "on"}" value="1" name="CLOSED">CLOSED</button>
    </div>
    <div class="option-c option-item">
      <button class="${date}-option option-${json.FLOW == 0 ? "on" : "off"}" value="0" name="FLOW">SCHEDULE</button>
    </div>
    <div class="option-d option-item">
      <button class="${date}-option option-${json.FLOW == 0 ? "off" : "on"}" value="1" name="FLOW">WALK-IN</button>
    </div>
    <div class="option-e option-item">
      <select class="${date}-option" name="OPEN">${selectOpenTimes}</select>
    </div>
    <div class="option-f option-item">
      <select class="${date}-option" name="CLOSE">${selectCloseTimes}</select>
    </div>
    <div class="option-g option-item">
      <textarea class="${date}-option" placeholder="Notes..." name="NOTES">${notes}</textarea>
    </div>
  `;

  header.innerHTML = template;
  // set event handlers
  let i = 1
  for (i; i < 4; i++) {
    header.children[i].children[0].addEventListener("click", setOption);
  }
  header.children[5].children[0].addEventListener("change", setOption);
  header.children[6].children[0].addEventListener("change", setOption);
  header.children[7].children[0].addEventListener("change", setOption);

  frag.appendChild(header);
  this.DOMheader = frag;
}

function entryKey() {
  let div = document.createElement("div");
      div.classList.add("entryKey");
  let template = `
  <span class="detail status">Status:</span>
  <span class="detail type">Type of job:</span>
  <span class="detail name">Name:</span>
  <span class="detail email">Email:</span>
  <span class="detail phone">Phone number:</span>
  <span class="detail descr">Bike description:</span>
  <span class="detail notes">Notes:</span>
  `;
  div.innerHTML = template;

  this.domKey = div;
}

function Entry(json) {
  let selectStatus = ["", "", "", "", "", ""];
      selectStatus[json.STATUS] = "selected";
  let selectType = ["", "", "", "", "", ""];
      selectType[json.TYPE] = "selected";

  let frag = document.createDocumentFragment();

  let div = document.createElement("div");
      div.classList = "entry";
      div.id = json.ID;

  let template = `
  <select class="detail status s-${json.STATUS}">
    <option value="0" ${selectStatus[0]}>Status...</option>
    <option value="1" ${selectStatus[1]}>Not here</option>
    <option value="2" ${selectStatus[2]}>Here, not done</option>
    <option value="3" ${selectStatus[3]}>Pending</option>
    <option value="4" ${selectStatus[4]}>Done</option>
    <option value="5" ${selectStatus[5]}>Done, gone</option>
  </select>
  <select class="detail type">
    <option value="0" ${selectType[0]}>Type...</option>
    <option value="1" ${selectType[1]}>Tune-up</option>
    <option value="2" ${selectType[2]}>Big job</option>
    <option value="3" ${selectType[3]}>Small job</option>
    <option value="4" ${selectType[4]}>Flat</option>
    <option value="5" ${selectType[5]}>Other</option>
  </select>
  <input type="text" class="detail name" value="${json.NAME}">
  <input type="text" class="detail email" value="${json.EMAIL}">
  <input type="text" class="detail phone" value="${json.PHONE}">
  <input type="text" class="detail descr" value="${json.DESCR}">
  <textarea class="detail notes">${json.NOTES}</textarea>
  <button class="delete" id="delete-${json.ID}" data-date="${json.DATE}" data-name="${json.NAME}">
    <img src="deleteicon.png" class="deleteIcon">
  </button>
  `;

  div.innerHTML = template;
  frag.appendChild(div);

  //set event handlers
  let i = 0;
  let l = div.children.length;
  for (i; i < l-1; i++) {
    if (div.children[i].type == "text") {
      if (div.children[i].value == "") {
        div.children[i].classList.add("flagged");
      }
      div.children[i].addEventListener("click", function(){
        this.select();
      })
    }
    div.children[i].addEventListener("change", saveChange);
  }
  div.children[7].addEventListener("click", deleteEntry);
  this.DOMentry = frag;
}

function blankEntry() {

  let frag = document.createDocumentFragment();
  let div = document.createElement("footer");
      div.className = "blank entry";
      
  let template = `
      <select class="detail status">
        <option value="0">Status...</option>
        <option value="1">Not here</option>
        <option value="2">Here, not done</option>
        <option value="3">Pending</option>
        <option value="4">Done</option>
        <option value="5">Done and gone</option>
      </select>
      <select class="detail type">
        <option value="0">Type...</option>
        <option value="1">Tune-up</option>
        <option value="2">Big job</option>
        <option value="3">Small job</option>
        <option value="4">Flat</option>
        <option value="5">Other</option>
      </select>
      <input type="text" class="detail name" placeholder="Name...">
      <input type="email" class="detail email" placeholder="Email...">
      <input type="tel" class="detail phone" placeholder="Phone...">
      <input type="text" class="detail descr" placeholder="Bike description...">
      <textarea class="detail notes" placeholder="Notes..."></textarea>
      <button class="delete">
        <img src="deleteicon.png" class="deleteIcon">
      </button>
  `;
  div.innerHTML = template;

  //set event handlers
  let i = 0;
  let l = div.children.length;

  for (i; i < l-1; i++) {
    div.children[i].addEventListener("change", saveNew);
  }

  frag.appendChild(div);

  this.DOMblank = frag;
}
