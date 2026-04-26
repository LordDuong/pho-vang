import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  update,
  remove,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

window.FirebaseRTDB = { initializeApp, getDatabase, ref, set, push, onValue, update, remove, get };