const KEY = "afya-store-v1";
const seed = {
  suppliers: [
    ["Healthcare Ltd", "0712345678"],
    ["Medcare Distributor", "0723456789"],
    ["Afya Medical Supplies", "0734567890"],
    ["Wellness Pharma Ltd", ""],
    ["PrimeMed Supplier", ""],
    ["City Medical Wholesalers", ""],
    ["Healthplus Suppliers", ""],
    ["Medicare Suppliers", ""],
  ].map((x, i) => ({ id: "s" + i, name: x[0], phone: x[1], email: "" })),
  medicines: [
    ["Paracetamol", "Pain relief", 98, 5, 0],
    ["Amoxcillin", "Antibiotic", 50, 0, 1],
    ["cetirizine", "Allergy", 80, 0, 2],
    ["vitamin c", "Vitamins", 120, 0, 3],
    ["Ibuprofen", "Pain relief", 60, 0, 4],
    ["Omeprazole", "Digestive health", 40, 0, 5],
    ["ORS sachets", "Rehydration", 200, 0, 2],
    ["loratadine", "Allergy", 70, 0, 6],
    ["Cough syrup", "Cold & flu", 70, 0, 7],
  ].map((x, i) => ({
    id: "m" + i,
    name: x[0],
    category: x[1],
    quantity: x[2],
    price: x[3],
    supplierId: "s" + x[4],
  })),
  sales: [
    {
      id: "SAL-001",
      soldAt: "2026-10-13T08:30:00",
      items: [
        {
          medicineId: "m0",
          name: "Paracetamol",
          quantity: 2,
          unitPrice: 5,
          lineTotal: 10,
        },
      ],
      total: 10,
    },
  ],
};
let db;
try {
  db = JSON.parse(localStorage.getItem(KEY)) || structuredClone(seed);
  if (!db.suppliers || !db.medicines || !db.sales) db = structuredClone(seed);
} catch {
  db = structuredClone(seed);
}
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    ),
  cash = (n) =>
    "KSh " +
    Number(n || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  save = () => localStorage.setItem(KEY, JSON.stringify(db)),
  sup = (id) => db.suppliers.find((s) => s.id === id)?.name || "No supplier",
  date = (s) =>
    new Date(s).toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  serial = () => `x${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
function status(q) {
  return q <= 0
    ? ["Out of stock", "out"]
    : q <= 15
      ? ["Low stock", "low"]
      : ["In stock", "good"];
}
function render() {
  dashboard();
  inventory();
  sales();
  suppliers();
  $("#today").textContent = new Date().toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  $("#lowBadge").textContent = db.medicines.filter(
    (m) => m.quantity <= 15,
  ).length;
}
function dashboard() {
  let rev = db.sales.reduce((a, s) => a + s.total, 0),
    low = db.medicines.filter((m) => m.quantity <= 15);
  $("#revenue").textContent = cash(rev);
  $("#saleCount").textContent = db.sales.length;
  $("#medicineCount").textContent = db.medicines.length;
  $("#alertCount").textContent = low.length;
  let rows = [...db.sales]
    .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
    .slice(0, 5);
  $("#recentRows").innerHTML = rows
    .map(
      (s) =>
        `<tr><td><strong>${esc(s.id)}</strong></td><td>${esc(date(s.soldAt))}</td><td>${s.items.length} product${s.items.length === 1 ? "" : "s"}</td><td class="money">${cash(s.total)}</td><td><span class="pill good">Completed</span></td></tr>`,
    )
    .join("");
  $("#recentEmpty").classList.toggle("hidden", rows.length > 0);
  $("#lowList").innerHTML = low.length
    ? low
        .slice(0, 6)
        .map(
          (m) =>
            `<div class="low-item"><b>✚</b><span><b>${esc(m.name)}</b><small>${esc(m.category)}</small></span><strong class="stock">${m.quantity} left</strong></div>`,
        )
        .join("")
    : '<p class="empty">All products have healthy stock levels.</p>';
}
function inventory() {
  let q = ($("#medicineSearch")?.value || "").toLowerCase(),
    items = db.medicines.filter((m) =>
      `${m.name} ${m.category} ${sup(m.supplierId)}`.toLowerCase().includes(q),
    );
  $("#inventoryRows").innerHTML = items
    .map((m) => {
      let [label, c] = status(m.quantity);
      return `<tr><td><strong>${esc(m.name)}</strong></td><td>${esc(m.category)}</td><td>${m.quantity} units</td><td class="money">${cash(m.price)}</td><td>${esc(sup(m.supplierId))}</td><td><span class="pill ${c}">${label}</span></td><td><button class="row-action" data-edit-med="${esc(m.id)}">Edit</button></td></tr>`;
    })
    .join("");
  $("#inventoryEmpty").classList.toggle("hidden", items.length > 0);
  $("#invCount").textContent = db.medicines.length;
  $("#invLow").textContent = db.medicines.filter(
    (m) => m.quantity <= 15,
  ).length;
  $("#invValue").textContent = cash(
    db.medicines.reduce((a, m) => a + m.quantity * m.price, 0),
  );
}
function inventory() {
  let q = ($("#medicineSearch")?.value || "").toLowerCase(),
    items = db.medicines.filter((m) =>
      `${m.name} ${m.category} ${sup(m.supplierId)}`.toLowerCase().includes(q),
    );
  $("#inventoryRows").innerHTML = items
    .map((m) => {
      let [label, c] = status(m.quantity);
      return `<tr><td><div class="product-name"><span class="product-picture"><img src="images/medicine-care.svg" alt=""></span><strong>${esc(m.name)}</strong></div></td><td>${esc(m.category)}</td><td>${m.quantity} units</td><td class="money">${cash(m.price)}</td><td>${esc(sup(m.supplierId))}</td><td><span class="pill ${c}">${label}</span></td><td><button class="row-action" data-edit-med="${esc(m.id)}">Edit</button></td></tr>`;
    })
    .join("");
  $("#inventoryEmpty").classList.toggle("hidden", items.length > 0);
  $("#invCount").textContent = db.medicines.length;
  $("#invLow").textContent = db.medicines.filter(
    (m) => m.quantity <= 15,
  ).length;
  $("#invValue").textContent = cash(
    db.medicines.reduce((a, m) => a + m.quantity * m.price, 0),
  );
}
function sales() {
  let items = [...db.sales].sort(
      (a, b) => new Date(b.soldAt) - new Date(a.soldAt),
    ),
    rev = items.reduce((a, s) => a + s.total, 0);
  $("#salesRevenue").textContent = cash(rev);
  $("#salesCount").textContent = items.length;
  $("#itemsSold").textContent = items.reduce(
    (a, s) => a + s.items.reduce((b, i) => b + i.quantity, 0),
    0,
  );
  $("#salesRows").innerHTML = items
    .map(
      (s) =>
        `<tr><td><strong>${esc(s.id)}</strong></td><td>${esc(date(s.soldAt))}</td><td>${s.items.map((i) => esc(i.name)).join(", ")}</td><td>${s.items.reduce((a, i) => a + i.quantity, 0)}</td><td class="money">${cash(s.total)}</td><td><span class="pill good">Completed</span></td></tr>`,
    )
    .join("");
  $("#salesEmpty").classList.toggle("hidden", items.length > 0);
}
function suppliers() {
  let q = ($("#supplierSearch")?.value || "").toLowerCase(),
    items = db.suppliers.filter((s) =>
      `${s.name} ${s.phone} ${s.email}`.toLowerCase().includes(q),
    );
  $("#supplierRows").innerHTML = items
    .map(
      (s) =>
        `<tr><td><strong>${esc(s.name)}</strong></td><td>${esc(s.phone || "—")}</td><td>${esc(s.email || "—")}</td><td>${db.medicines.filter((m) => m.supplierId === s.id).length}</td><td><button class="row-action" data-edit-sup="${esc(s.id)}">Edit</button></td></tr>`,
    )
    .join("");
  $("#supplierCount").textContent =
    `${db.suppliers.length} supplier${db.suppliers.length === 1 ? "" : "s"}`;
  $("#supplierEmpty").classList.toggle("hidden", items.length > 0);
}
function go(p) {
  document
    .querySelectorAll(".page")
    .forEach((x) => x.classList.toggle("active", x.id === p));
  document
    .querySelectorAll(".nav")
    .forEach((x) => x.classList.toggle("active", x.dataset.page === p));
  $("#crumb").textContent = p[0].toUpperCase() + p.slice(1);
  $("#sidebar").classList.remove("open");
}
function toast(s) {
  let t = $("#toast");
  t.textContent = s;
  t.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}
function field(n, label, opt = {}) {
  let val = opt.value ?? "",
    control = opt.options
      ? `<select id="f-${n}" name="${n}" ${opt.required ? "required" : ""}>${opt.options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`
      : `<input id="f-${n}" name="${n}" type="${opt.type || "text"}" value="${esc(val)}" placeholder="${esc(opt.placeholder || "")}" ${opt.min !== undefined ? `min="${opt.min}"` : ""} ${opt.step ? `step="${opt.step}"` : ""} ${opt.required ? "required" : ""}>`;
  return `<div class="field ${opt.full ? "full" : ""}"><label for="f-${n}">${label}${opt.required ? " *" : ""}</label>${control}</div>`;
}
function modal(title, button, html, submit, kicker = "PHARMACY MANAGEMENT") {
  $("#modalTitle").textContent = title;
  $("#submit").textContent = button;
  $("#modalEyebrow").textContent = kicker;
  $("#fields").innerHTML = html;
  $("#error").classList.add("hidden");
  $("#backdrop").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("#form").onsubmit = (e) => {
    e.preventDefault();
    if (submit(new FormData(e.currentTarget)) !== false) close();
  };
  setTimeout(() => $("#fields input,#fields select")?.focus(), 20);
}
function close() {
  $("#backdrop").classList.add("hidden");
  document.body.style.overflow = "";
  $("#form").onsubmit = null;
}
function error(s) {
  $("#error").textContent = s;
  $("#error").classList.remove("hidden");
}
function medicine(existing) {
  let options = [
    { value: "", label: "Choose a supplier" },
    ...db.suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];
  modal(
    existing ? "Edit medicine" : "Add medicine",
    existing ? "Save changes" : "Add medicine",
    field("name", "Medicine name", {
      value: existing?.name,
      required: true,
      placeholder: "e.g. Paracetamol",
      full: true,
    }) +
      field("category", "Category", {
        value: existing?.category,
        required: true,
        placeholder: "e.g. Pain relief",
      }) +
      field("quantity", "Quantity in stock", {
        type: "number",
        value: existing?.quantity ?? 0,
        min: 0,
        required: true,
      }) +
      field("price", "Unit price (KSh)", {
        type: "number",
        value: existing?.price ?? "",
        min: 0,
        step: "0.01",
        required: true,
      }) +
      field("supplier", "Supplier", {
        options,
        value: existing?.supplierId || "",
        full: true,
      }),
    (fd) => {
      let name = fd.get("name").trim(),
        category = fd.get("category").trim(),
        quantity = Number(fd.get("quantity")),
        price = Number(fd.get("price"));
      if (!name || !category)
        return error("Enter the medicine name and category.");
      if (quantity < 0 || price < 0 || !Number.isFinite(quantity + price))
        return error("Quantity and price must be zero or greater.");
      let m = {
        id: existing?.id || serial(),
        name,
        category,
        quantity,
        price,
        supplierId: fd.get("supplier"),
      };
      if (existing)
        db.medicines = db.medicines.map((x) => (x.id === m.id ? m : x));
      else db.medicines.push(m);
      save();
      render();
      toast(existing ? "Medicine updated." : "Medicine added.");
    },
  );
}
function supplier(existing) {
  modal(
    existing ? "Edit supplier" : "Add supplier",
    existing ? "Save changes" : "Add supplier",
    field("name", "Supplier name", {
      value: existing?.name,
      required: true,
      placeholder: "Business or contact name",
      full: true,
    }) +
      field("phone", "Phone number", {
        value: existing?.phone,
        placeholder: "0712 345 678",
      }) +
      field("email", "Email address", {
        type: "email",
        value: existing?.email,
        placeholder: "name@example.com",
      }),
    (fd) => {
      let name = fd.get("name").trim();
      if (!name) return error("Enter a supplier name.");
      let s = {
        id: existing?.id || serial(),
        name,
        phone: fd.get("phone").trim(),
        email: fd.get("email").trim(),
      };
      if (existing)
        db.suppliers = db.suppliers.map((x) => (x.id === s.id ? s : x));
      else db.suppliers.push(s);
      save();
      render();
      toast(existing ? "Supplier updated." : "Supplier added.");
    },
  );
}
function sale() {
  let available = db.medicines.filter((m) => m.quantity > 0);
  if (!available.length) {
    toast("No medicines are in stock.");
    return go("inventory");
  }
  let opts = available.map((m) => ({
    value: m.id,
    label: `${m.name} · ${m.quantity} in stock · ${cash(m.price)}`,
  }));
  modal(
    "Record a sale",
    "Complete sale",
    '<div class="field full"><label>Sale items *</label><div id="saleLines"></div><button class="row-action" type="button" id="addLine">＋ Add another item</button></div>',
    (fd) => {
      let selected = [...document.querySelectorAll(".sale-line")].map((el) => ({
        medicineId: el.querySelector("select").value,
        quantity: Number(el.querySelector("input").value),
      }));
      if (!selected.length) return error("Add at least one product.");
      let seen = new Set();
      for (let x of selected) {
        let m = db.medicines.find((z) => z.id === x.medicineId);
        if (seen.has(x.medicineId))
          return error(
            "Each medicine can appear once. Adjust its quantity on that row.",
          );
        seen.add(x.medicineId);
        if (!m || !Number.isInteger(x.quantity) || x.quantity < 1)
          return error("Enter a whole number quantity of at least 1.");
        if (x.quantity > m.quantity)
          return error(`${m.name} only has ${m.quantity} units in stock.`);
      }
      let lines = selected.map((x) => {
          let m = db.medicines.find((z) => z.id === x.medicineId);
          m.quantity -= x.quantity;
          return {
            medicineId: m.id,
            name: m.name,
            quantity: x.quantity,
            unitPrice: m.price,
            lineTotal: m.price * x.quantity,
          };
        }),
        total = lines.reduce((a, x) => a + x.lineTotal, 0);
      db.sales.push({
        id: `SAL-${String(db.sales.length + 1).padStart(3, "0")}`,
        soldAt: new Date().toISOString(),
        items: lines,
        total,
      });
      save();
      render();
      toast(`Sale recorded · ${cash(total)}`);
    },
    "NEW TRANSACTION",
  );
  let add = () => {
    let line = document.createElement("div");
    line.className = "sale-line";
    line.innerHTML = `<select aria-label="Medicine">${opts.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("")}</select><input type="number" min="1" value="1" aria-label="Quantity"><button type="button" aria-label="Remove">×</button>`;
    $("#saleLines").append(line);
    line.querySelector("button").onclick = () => {
      line.remove();
      if (!$("#saleLines").children.length) add();
    };
  };
  add();
  $("#addLine").onclick = add;
}
document.addEventListener("click", (e) => {
  let p = e.target.closest("[data-page]");
  if (p) return go(p.dataset.page);
  let a = e.target.closest("[data-action]")?.dataset.action;
  if (a === "sale") return sale();
  if (a === "medicine") return medicine();
  if (a === "supplier") return supplier();
  let m = e.target.closest("[data-edit-med]");
  if (m) return medicine(db.medicines.find((x) => x.id === m.dataset.editMed));
  let s = e.target.closest("[data-edit-sup]");
  if (s) return supplier(db.suppliers.find((x) => x.id === s.dataset.editSup));
});
$("#close").onclick = close;
$("#cancel").onclick = close;
$("#backdrop").onclick = (e) => {
  if (e.target === $("#backdrop")) close();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") close();
});
$("#medicineSearch").oninput = inventory;
$("#supplierSearch").oninput = suppliers;
$("#menu").onclick = () => $("#sidebar").classList.toggle("open");
render();
document.addEventListener('DOMContentLoaded', async () => {
  const section = document.createElement('section');
  section.innerHTML = `
    <h2>Medicines from the database</h2>
    <p id="medicine-message">Loading medicines...</p>
    <table id="medicine-table" border="1" cellpadding="8">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Expiry date</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  document.body.appendChild(section);

  const message = section.querySelector('#medicine-message');
  const tableBody = section.querySelector('tbody');

  try {
    const response = await fetch('./medicines.php');
    if (!response.ok) throw new Error('Could not load medicines');

    const medicines = await response.json();

    for (const medicine of medicines) {
      const row = document.createElement('tr');

      for (const value of [
        medicine.medicine_name,
        medicine.category,
        medicine.quantity,
        `KSh ${medicine.unit_price}`,
        medicine.expiry_date
      ]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      }

      tableBody.appendChild(row);
    }

    message.textContent = medicines.length
      ? ''
      : 'No medicines were found.';
  } catch (error) {
    message.textContent = 'Could not load medicines.';
    console.error(error);
  }
});
document.addEventListener('DOMContentLoaded', async () => {
  const section = document.createElement('section');
  section.innerHTML = `
    <h2>Suppliers</h2>
    <p id="supplier-message">Loading suppliers...</p>
    <table border="1" cellpadding="8">
      <thead>
        <tr>
          <th>Supplier</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  document.body.appendChild(section);

  const message = section.querySelector('#supplier-message');
  const tableBody = section.querySelector('tbody');

  try {
    const response = await fetch('./suppliers.php');
    if (!response.ok) throw new Error('Could not load suppliers');

    const suppliers = await response.json();

    for (const supplier of suppliers) {
      const row = document.createElement('tr');

      for (const value of [
        supplier.supplier_name,
        supplier.phone,
        supplier.email,
        supplier.address
      ]) {
        const cell = document.createElement('td');
        cell.textContent = value ?? 'Not provided';
        row.appendChild(cell);
      }

      tableBody.appendChild(row);
    }

    message.textContent = '';
  } catch (error) {
    message.textContent = 'Could not load suppliers.';
    console.error(error);
  }
});
