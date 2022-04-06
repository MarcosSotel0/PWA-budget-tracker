// hold db connection
let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {

    // save a reference to the database 
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon successful 
request.onsuccess = function(event) {

    // save reference to db in global variable
    db = event.target.result;
  
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
  request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//no internet connection
function saveRecord(record) {

    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access the object store for `new_transaction`
    const  budgetObjectStore = transaction.objectStore('new_transaction');
  
    // add record to your store with add method
    budgetObjectStore.add(record);
};

function uploadTransaction() {

    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    
    const getAll = budgetObjectStore.getAll();
  
    getAll.onsuccess = function() {

    // if there was data in indexedDb's store send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
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

          // open one more transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');

          // access the new_transaction object store
          const budgetObjectStore = transaction.objectStore('new_transaction');
          
          // clear all items in your store
          budgetObjectStore.clear();

          alert('All saved transactions has been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
};

// listen for app coming back online
window.addEventListener('online', uploadTransaction);