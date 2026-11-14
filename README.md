# Cafeteria Order Management System

**Subject:** Data Structures  
**Course:** MCA Semester 1

## About the Project

This project is a simple Cafeteria Order Management System developed as part of the Data Structures assignment. It uses a **Queue data structure** to manage customer orders based on the FIFO (First In, First Out) principle.

Customers can select food items, enter their name and place orders. The cafeteria staff can process orders and update their status as they move through different stages.

## Features

- Place orders by selecting menu items and quantities.
- View pending orders in a FIFO queue.
- Start cooking the next order in the queue.
- Mark orders as ready for pickup or completed.
- View customer-wise orders and total bills.
- Track order activity and current order status.
- Reset the system to start a new session.

## Data Structure Used

**Queue (FIFO)**

A JavaScript array is used to implement the queue.

- `push()` – Adds new orders to the rear of the queue.
- `shift()` – Removes the oldest order from the front of the queue.
- `pendingOrders[0]` – Accesses the front order without removing it.

Orders follow this sequence:

**Place Order → Pending Queue → Cooking → Ready for Pickup → Completed**

## How to Run

1. Download or clone this repository.
2. Keep `index.html`, `style.css` and `app.js` in the same folder.
3. Open `index.html` in any modern web browser.
4. Enter a customer name, select menu quantities and click **Place Order**.
5. Use the order management buttons to process orders through each stage.

No additional installation or external dependencies are required.

## Technologies Used

- HTML
- CSS
- JavaScript

**GitHub Repository:** https://github.com/dhairyabhatia26/cafeOrderMgmt
