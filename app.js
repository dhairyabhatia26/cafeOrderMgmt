// ==========================================================
//  app.js  —  Cafeteria Order Management System
//  Data Structures Assignment  |  Pure HTML + CSS + JS
//
//  Data Structure Used: JavaScript Array as a FIFO Queue
//
//  Key queue operations used in this file:
//    pendingOrders.push(order)   — add a new order to the REAR
//    pendingOrders.shift()       — remove the order at the FRONT
//    pendingOrders[0]            — peek at the FRONT (without removing)
//
//  Order lifecycle:
//    Place Order → pendingOrders (queue) → cookingOrder → readyOrders → completedOrders
// ==========================================================


// ----------------------------------------------------------
// SECTION 1: FIXED MENU
// A plain array of objects. Each object has an item name
// and a price per unit (in rupees).
// ----------------------------------------------------------
var MENU = [
  { item: "Samosa", price: 15 },
  { item: "Sandwich", price: 40 },
  { item: "Tea", price: 15 },
  { item: "Burrito", price: 55 },
  { item: "Coffee", price: 45 },
  { item: "Burger", price: 35 }
];


// ----------------------------------------------------------
// SECTION 2: QUEUE DATA (the core data structure)
//
// pendingOrders  - array used as a FIFO queue
//                  push() adds to the rear
//                  shift() removes from the front
//
// cookingOrder   - holds the ONE order currently being cooked
//                  null means nothing is cooking right now
//
// readyOrders    - array of orders ready for pickup
//
// completedOrders - array of orders already collected
//
// allOrders      - every order ever placed, in order. Only used
//                  to build the customer-wise list.
//
// nextOrderId    - a simple counter so each order gets a
//                  unique ID: 1, 2, 3, ...
// ----------------------------------------------------------
var pendingOrders = [];   // FIFO queue - the main data structure
var cookingOrder = null; // single order being cooked right now
var readyOrders = [];   // orders ready for pickup
var completedOrders = [];   // orders collected / done
var allOrders = [];   // every order (for the customer-wise list)
var nextOrderId = 1;    // auto-increment ID counter

// Each order has a status: "pending", "cooking", "ready" or "done".
// This lookup gives the text shown on screen for each status.
var STATUS_TEXT = {
  pending: "Pending",
  cooking: "Cooking",
  ready: "Ready",
  done: "Completed"
};


// ----------------------------------------------------------
// SECTION 3: DOM REFERENCES
// Get every HTML element we will update from JavaScript.
// ----------------------------------------------------------
var menuBody = document.getElementById("menu-body");
var nameInput = document.getElementById("customer-name");
var pendingList = document.getElementById("pending-list");
var cookingSlot = document.getElementById("cooking-slot");
var readyList = document.getElementById("ready-list");
var completedList = document.getElementById("completed-list");
var customersList = document.getElementById("customers-list");
var activityLog = document.getElementById("activity-log");
var placeMsg = document.getElementById("place-msg");

var countPending = document.getElementById("count-pending");
var countCooking = document.getElementById("count-cooking");
var countReady = document.getElementById("count-ready");
var countDone = document.getElementById("count-done");

var btnPlace = document.getElementById("btn-place");
var btnCook = document.getElementById("btn-cook");
var btnReady = document.getElementById("btn-ready");
var btnComplete = document.getElementById("btn-complete");
var btnReset = document.getElementById("btn-reset");


// ----------------------------------------------------------
// SECTION 4: BUILD THE MENU TABLE
// Loop through MENU and create one table row per item.
// Each row has a number input so the customer picks a qty.
// Every quantity starts at 0 (nothing selected).
// ----------------------------------------------------------
function buildMenuTable() {
  menuBody.innerHTML = ""; // clear anything already there

  for (var i = 0; i < MENU.length; i++) {
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + MENU[i].item + "</td>" +
      "<td>&#8377;" + MENU[i].price + "</td>" +
      "<td><input type='number' class='qty-input' id='qty-" + i + "' value='0' min='0' max='10' /></td>";
    menuBody.appendChild(row);
  }
}


// ----------------------------------------------------------
// SECTION 5: PLACE ORDER
// When the customer clicks "Place Order":
//   1. Read the customer name (it is required).
//   2. Find every menu row that has a quantity of 1 or more.
//   3. Build a new order object for each one.
//   4. push() it onto the pendingOrders array (rear of queue).
//   5. Refresh the whole display.
// ----------------------------------------------------------
btnPlace.addEventListener("click", function () {
  var customerName = nameInput.value.trim();
  if (customerName === "") {
    placeMsg.textContent = "Enter the customer name.";
    return;
  }

  var placedAny = false;

  // Check EVERY menu row. Each item with a quantity >= 1
  // becomes its own order at the rear of the queue.
  for (var i = 0; i < MENU.length; i++) {
    var inputEl = document.getElementById("qty-" + i);
    var qty = parseInt(inputEl.value, 10);

    if (qty >= 1) {
      // Build the new order object
      var newOrder = {
        id: nextOrderId,              // unique ID for this order
        customer: customerName,             // who ordered
        item: MENU[i].item,             // food name
        quantity: qty,                      // how many
        price: MENU[i].price * qty,      // total price
        status: "pending"                 // where the order is now
      };

      nextOrderId = nextOrderId + 1;         // increment for the next order

      // QUEUE OPERATION: push() - add to the REAR of the queue
      pendingOrders.push(newOrder);
      allOrders.push(newOrder);              // also remember it for the customer list

      addLog("Order #" + newOrder.id + " placed by " + customerName + ": " + newOrder.item + " x" + newOrder.quantity + " added to queue (rear).", "place");
      inputEl.value = 0;                     // reset this box for the next order
      placedAny = true;
    }
  }

  if (!placedAny) {
    placeMsg.textContent = "Enter a quantity of at least 1 for any item.";
    return;
  }

  nameInput.value = "";                 // ready for the next customer
  placeMsg.textContent = "";                 // clear any old error message
  refreshDisplay();
});


// ----------------------------------------------------------
// SECTION 6: START COOKING
// When staff clicks "Start Cooking Next":
//   1. Check that nothing is already cooking.
//   2. Check that the queue is not empty.
//   3. shift() - remove the FRONT order from the queue.
//   4. Store it in cookingOrder.
//   5. Refresh the display.
// ----------------------------------------------------------
btnCook.addEventListener("click", function () {
  // Guard: do not start if already cooking
  if (cookingOrder !== null) {
    addLog("ERROR: Already cooking Order #" + cookingOrder.id + ". Mark it ready first.", "error");
    return;
  }

  // Guard: do not start if no orders are waiting
  if (pendingOrders.length === 0) {
    addLog("ERROR: No pending orders in the queue.", "error");
    return;
  }

  // QUEUE OPERATION: shift() - remove from the FRONT (oldest order)
  cookingOrder = pendingOrders.shift();
  cookingOrder.status = "cooking";

  addLog("Order #" + cookingOrder.id + " (" + cookingOrder.customer + ") dequeued from front \u2192 now cooking.", "cook");
  refreshDisplay();
});


// ----------------------------------------------------------
// SECTION 7: MARK READY
// When staff clicks "Mark Ready":
//   1. Check that something is actually cooking.
//   2. Move cookingOrder into the readyOrders array.
//   3. Clear cookingOrder back to null.
//   4. Refresh the display.
// ----------------------------------------------------------
btnReady.addEventListener("click", function () {
  if (cookingOrder === null) {
    addLog("ERROR: Nothing is currently being cooked.", "error");
    return;
  }

  // Move the cooking order to the ready list
  cookingOrder.status = "ready";
  readyOrders.push(cookingOrder);

  addLog("Order #" + cookingOrder.id + " (" + cookingOrder.customer + ") is ready for pickup!", "ready");
  cookingOrder = null; // cooking slot is now free
  refreshDisplay();
});


// ----------------------------------------------------------
// SECTION 8: MARK COMPLETED
// When staff clicks "Mark Completed":
//   1. Check that at least one order is ready.
//   2. shift() - take the oldest ready order (FIFO).
//   3. Move it to completedOrders.
//   4. Refresh the display.
// ----------------------------------------------------------
btnComplete.addEventListener("click", function () {
  if (readyOrders.length === 0) {
    addLog("ERROR: No orders are ready for pickup.", "error");
    return;
  }

  // Take the first (oldest) ready order
  var doneOrder = readyOrders.shift();
  doneOrder.status = "done";

  completedOrders.push(doneOrder);

  addLog("Order #" + doneOrder.id + " (" + doneOrder.customer + ") collected \u2014 marked as completed.", "complete");
  refreshDisplay();
});


// ----------------------------------------------------------
// SECTION 9: RESET
// Clear all data, the activity log and the order form, so the
// page looks exactly like a fresh start.
// ----------------------------------------------------------
btnReset.addEventListener("click", function () {
  var confirmed = confirm("Reset ALL orders? This cannot be undone.");
  if (!confirmed) {
    return;
  }

  pendingOrders = [];
  cookingOrder = null;
  readyOrders = [];
  completedOrders = [];
  allOrders = [];
  nextOrderId = 1;

  // Wipe the old activity log completely, then clear the order form
  activityLog.innerHTML = "";
  nameInput.value = "";
  placeMsg.textContent = "";
  for (var i = 0; i < MENU.length; i++) {
    document.getElementById("qty-" + i).value = 0;
  }

  // Start again exactly like a fresh page load
  addLog("System ready. Place an order to begin.", "info");
  refreshDisplay();
});


// ----------------------------------------------------------
// SECTION 10: REFRESH DISPLAY
// Called after every action to redraw all sections.
// ----------------------------------------------------------
function refreshDisplay() {
  showPendingQueue();
  showCooking();
  showReady();
  showCompleted();
  showCustomers();
  updateCounts();
}


// ----------------------------------------------------------
// SECTION 11: HELPERS
// safeText()     - turns text into safe HTML, so a customer name
//                  like "<b>" cannot break the page.
// makeCardHtml() - the text inside one order card:
//                  line 1: #ID  Item ............ Price
//                  line 2: Customer ............ Qty
// ----------------------------------------------------------
function safeText(text) {
  var box = document.createElement("div");
  box.textContent = text;
  return box.innerHTML;
}

function makeCardHtml(order) {
  return "<div class='card-line'>" +
    "<span><span class='order-id'>#" + order.id + "</span> " +
    "<span class='order-item'>" + order.item + "</span></span>" +
    "<span class='order-price'>&#8377;" + order.price.toFixed(2) + "</span>" +
    "</div>" +
    "<div class='card-line card-sub'>" +
    "<span>" + safeText(order.customer) + "</span>" +
    "<span>Qty " + order.quantity + "</span>" +
    "</div>";
}


// ----------------------------------------------------------
// SECTION 12: SHOW PENDING QUEUE
// Draw one card per order. The first card (index 0) is the
// FRONT (next to cook). The last card is the REAR (newest).
// ----------------------------------------------------------
function showPendingQueue() {
  pendingList.innerHTML = "";

  if (pendingOrders.length === 0) {
    pendingList.innerHTML = "<p class='empty-msg'>Queue is empty</p>";
    return;
  }

  for (var i = 0; i < pendingOrders.length; i++) {
    var order = pendingOrders[i];

    // Add an arrow between cards (not before the first one)
    if (i > 0) {
      var arrow = document.createElement("div");
      arrow.className = "queue-arrow";
      arrow.textContent = "\u2192"; // right arrow
      pendingList.appendChild(arrow);
    }

    // Decide CSS classes for FRONT / REAR labels
    var cardClass = "order-card";
    if (i === 0) cardClass += " is-front";
    if (i === pendingOrders.length - 1) cardClass += " is-rear";

    var card = document.createElement("div");
    card.className = cardClass;
    card.innerHTML = makeCardHtml(order);

    pendingList.appendChild(card);
  }
}


// ----------------------------------------------------------
// SECTION 13: SHOW COOKING
// ----------------------------------------------------------
function showCooking() {
  cookingSlot.innerHTML = "";

  if (cookingOrder === null) {
    cookingSlot.innerHTML = "<p class='empty-msg'>Nothing cooking</p>";
    return;
  }

  var card = document.createElement("div");
  card.className = "order-card state-cooking";
  card.innerHTML = makeCardHtml(cookingOrder);

  cookingSlot.appendChild(card);
}


// ----------------------------------------------------------
// SECTION 14: SHOW READY FOR PICKUP
// ----------------------------------------------------------
function showReady() {
  readyList.innerHTML = "";

  if (readyOrders.length === 0) {
    readyList.innerHTML = "<p class='empty-msg'>No orders ready</p>";
    return;
  }

  for (var i = 0; i < readyOrders.length; i++) {
    var card = document.createElement("div");
    card.className = "order-card state-ready";
    card.innerHTML = makeCardHtml(readyOrders[i]);
    readyList.appendChild(card);
  }
}


// ----------------------------------------------------------
// SECTION 15: SHOW COMPLETED ORDERS
// Newest first (reverse loop) so the latest completed order
// appears at the top.
// ----------------------------------------------------------
function showCompleted() {
  completedList.innerHTML = "";

  if (completedOrders.length === 0) {
    completedList.innerHTML = "<p class='empty-msg'>No completed orders yet</p>";
    return;
  }

  // Loop from the end of the array to show newest first
  for (var i = completedOrders.length - 1; i >= 0; i--) {
    var card = document.createElement("div");
    card.className = "order-card state-done";
    card.innerHTML = makeCardHtml(completedOrders[i]);
    completedList.appendChild(card);
  }
}


// ----------------------------------------------------------
// SECTION 16: SHOW CUSTOMER-WISE ORDERS
// Goes through allOrders and groups the orders by customer
// name (not case-sensitive: "asha" and "Asha" are the same
// customer). For each customer it shows every order with its
// current status, plus the total bill.
// ----------------------------------------------------------
function showCustomers() {
  customersList.innerHTML = "";

  if (allOrders.length === 0) {
    customersList.innerHTML = "<p class='empty-msg'>No customers yet</p>";
    return;
  }

  // Step 1: group the orders by customer name
  var groups = {};   // key = "c_" + lowercase name, value = { name, orders }
  var keys = [];   // customer keys, in the order they first ordered

  for (var i = 0; i < allOrders.length; i++) {
    var order = allOrders[i];
    var key = "c_" + order.customer.toLowerCase();

    if (groups[key] === undefined) {
      groups[key] = { name: order.customer, orders: [] };
      keys.push(key);
    }
    groups[key].orders.push(order);
  }

  // Step 2: draw one block per customer
  for (var k = 0; k < keys.length; k++) {
    var group = groups[keys[k]];
    var total = 0;
    var lines = "";

    for (var j = 0; j < group.orders.length; j++) {
      var o = group.orders[j];
      total = total + o.price;
      lines +=
        "<div class='customer-order'>" +
        "<span>#" + o.id + " " + o.item + " x" + o.quantity + "</span>" +
        "<span class='status-badge badge-" + o.status + "'>" + STATUS_TEXT[o.status] + "</span>" +
        "</div>";
    }

    var count = group.orders.length;
    var block = document.createElement("div");
    block.className = "customer-group";
    block.innerHTML =
      "<div class='customer-head'>" +
      "<span><span class='customer-name'>" + safeText(group.name) + "</span> " +
      "<span class='customer-count'>" + count + (count === 1 ? " order" : " orders") + "</span></span>" +
      "<span class='customer-total'>&#8377;" + total.toFixed(2) + "</span>" +
      "</div>" +
      lines;

    customersList.appendChild(block);
  }
}


// ----------------------------------------------------------
// SECTION 17: UPDATE SUMMARY COUNTS + BUTTON STATES
// ----------------------------------------------------------
function updateCounts() {
  countPending.textContent = pendingOrders.length;
  countCooking.textContent = (cookingOrder !== null) ? 1 : 0;
  countReady.textContent = readyOrders.length;
  countDone.textContent = completedOrders.length;

  // Disable buttons when there is nothing for them to act on
  btnCook.disabled = (pendingOrders.length === 0) || (cookingOrder !== null);
  btnReady.disabled = (cookingOrder === null);
  btnComplete.disabled = (readyOrders.length === 0);
}


// ----------------------------------------------------------
// SECTION 18: ACTIVITY LOG
// Add a new message line at the TOP of the log.
// ----------------------------------------------------------
function addLog(message, type) {
  // Map action type to a CSS class for colour coding
  var cssClass = "log-info";
  if (type === "place") cssClass = "log-place";
  if (type === "cook") cssClass = "log-cook";
  if (type === "ready") cssClass = "log-ready";
  if (type === "complete") cssClass = "log-complete";
  if (type === "reset") cssClass = "log-reset";
  if (type === "error") cssClass = "log-error";

  var li = document.createElement("li");
  li.className = cssClass;
  li.textContent = message;

  // insertBefore with firstChild puts it at the top of the list
  activityLog.insertBefore(li, activityLog.firstChild);

  // Keep the log from growing too long - remove old entries
  while (activityLog.children.length > 30) {
    activityLog.removeChild(activityLog.lastChild);
  }
}


// ----------------------------------------------------------
// SECTION 19: INITIALISE
// Run once when the page loads.
// ----------------------------------------------------------
function init() {
  buildMenuTable();
  refreshDisplay();
  addLog("System ready. Place an order to begin.", "info");
}

// Start the app when the page has finished loading
window.addEventListener("DOMContentLoaded", init);
