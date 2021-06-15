// indexedDB database for web browser storage whenn offline.
const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

const dbName = "budget";
const dbVersion = 1;
const request = indexedDB.open(dbName, dbVersion);
let db;

request.onupgradeneeded = function (event) {
  console.log("On-Upgrade Event; IDB Database Created");
  
  const db = event.target.result;
 
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function (event) {
  console.log("On-Success Event; IDB Database Exists");
 
  db = event.target.result;
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  console.log("On-Error Event; Error:"+event.target.errorCode);
};

function saveRecord(record) {
  console.log("App is offline; data saved into indexedDB and will be uplaoded once app is back online");
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  transactionObjectStore.add(record);
}

function uploadTransaction() {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  const getAll = transactionObjectStore.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const transactionObjectStore = transaction.objectStore('new_transaction');
          transactionObjectStore.clear();
          console.log("App is online again, data saved in indexedDB has been uploaded into app database");
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}
// Upload data being recorded in indexedDB when offline once APP is online.
window.addEventListener('online', uploadTransaction);