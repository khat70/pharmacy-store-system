const KEY = "pharmacy-store-v1";
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
  async function loadMedicinesFromDatabase() {
  const medicineResponse = await fetch("medicines.php", { cache: "no-store" });
  const medicineRows = await medicineResponse.json();

  if (!medicineResponse.ok) {
    throw new Error(medicineRows.error || "Could not load medicines.");
  }

  db.medicines = medicineRows.map((m) => ({
    id: String(m.id),
    name: m.medicine_name,
    category: m.category || "",
    quantity: Number(m.quantity),
    price: Number(m.unit_price),
    expiryDate: m.expiry_date || "",
    supplierId: String(m.supplier_id ?? ""),
  }));

  if (!document.body.classList.contains("role-cashier")) {
    const supplierResponse = await fetch("suppliers.php", { cache: "no-store" });
    const supplierRows = await supplierResponse.json();

    if (!supplierResponse.ok) {
      throw new Error(supplierRows.error || "Could not load suppliers.");
    }

    db.suppliers = supplierRows.map((s) => ({
      id: String(s.id),
      name: s.supplier_name,
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
    }));
  }

  render();
}

  
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
    const low = db.medicines.filter((m) => m.quantity <= 15);
    const today = new Date();
today.setHours(0, 0, 0, 0);

const expiryLimit = new Date(today);
expiryLimit.setDate(expiryLimit.getDate() + 30);

const expiring = db.medicines.filter((m) => {
  if (!m.expiryDate) return false;

  const expiry = new Date(`${m.expiryDate}T00:00:00`);
  return !Number.isNaN(expiry.getTime()) && expiry <= expiryLimit;
});

  $("#medicineCount").textContent = db.medicines.length;
  $("#alertCount").textContent = low.length;

  fetch("sales_list.php", { cache: "no-store" })
    .then(async (response) => {
      const sales = await response.json();

      if (!response.ok) {
        throw new Error(sales.error || "Could not load sales.");
      }

      return sales;
    })
    .then((sales) => {
      const totalRevenue = sales.reduce(
        (sum, sale) => sum + Number(sale.total || 0),
        0,
      );

      $("#revenue").textContent = cash(totalRevenue);
      $("#saleCount").textContent = sales.length;

      const rows = [...sales]
        .sort((a, b) => new Date(b.sold_at) - new Date(a.sold_at))
        .slice(0, 5);

      $("#recentRows").innerHTML = rows
        .map(
          (sale) =>
            `<tr>
              <td><strong>${esc(sale.sale_number || `SAL-${sale.id}`)}</strong></td>
              <td>${esc(date(sale.sold_at))}</td>
              <td>${esc(sale.items || "Sale")}</td>
              <td class="money">${cash(Number(sale.total || 0))}</td>
              <td><span class="pill good">Completed</span></td>
            </tr>`,
        )
        .join("");

      $("#recentEmpty").classList.toggle("hidden", rows.length > 0);
    })
    .catch((error) => {
      $("#recentRows").innerHTML =
        `<tr><td colspan="5">${esc(error.message)}</td></tr>`;
      $("#recentEmpty").classList.add("hidden");
    });
  $("#lowList").innerHTML = low.length
    ? low
        .slice(0, 6)
        .map(
          (m) =>
            `<div class="low-item"><b>✚</b><span><b>${esc(m.name)}</b><small>${esc(m.category)}</small></span><strong class="stock">${m.quantity} left</strong></div>`,
        )
        .join("")
    : '<p class="empty">All products have healthy stock levels.</p>';
      $("#expiryList").innerHTML = expiring.length
    ? expiring
        .map((m) => {
  const expiry = new Date(`${m.expiryDate}T00:00:00`);
  const label = expiry < today ? "Expired" : "Expires";

  return `<div class="low-item"><b>⚠</b><span><b>${esc(m.name)}</b><small>${label} ${esc(m.expiryDate)}</small></span></div>`;
})
        .join("")
    : '<p class="empty">No medicines expire within 30 days.</p>';
}
function inventory() {
  let q = ($("#medicineSearch")?.value || "").toLowerCase(),
    items = db.medicines.filter((m) =>
      `${m.name} ${m.category} ${sup(m.supplierId)}`.toLowerCase().includes(q),
    );
  $("#inventoryRows").innerHTML = items
    .map((m) => {
      let [label, c] = status(m.quantity);
      return `<tr><td><div class="product-name"><span class="product-picture"><img src="images/medicine-care.svg" alt=""></span><strong>${esc(m.name)}</strong></div></td><td>${esc(m.category)}</td><td>${m.quantity} units</td><td>${esc(m.expiryDate || "Not set")}</td><td class="money">${cash(m.price)}</td><td>${esc(sup(m.supplierId))}</td><td><span class="pill ${c}">${label}</span></td><td><button class="row-action" data-edit-med="${esc(m.id)}">Edit</button></td></tr>`;
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
async function sale() {
  let liveMedicines;

  try {
    const response = await fetch("medicines.php");
    liveMedicines = await response.json();

    if (!response.ok) {
      throw new Error(liveMedicines.error || "Could not load medicines.");
    }
  } catch (err) {
    toast(err.message || "Could not load medicines.");
    return;
  }

  const today = new Date();
today.setHours(0, 0, 0, 0);

const available = liveMedicines.filter((m) => {
  if (Number(m.quantity) <= 0) return false;
  if (!m.expiry_date) return true;

  const expiry = new Date(`${m.expiry_date}T00:00:00`);
  return !Number.isNaN(expiry.getTime()) && expiry >= today;
});

  if (!available.length) {
  toast("No non-expired medicines are available in stock.");
  return;
}

  const opts = available.map((m) => ({
    value: m.id,
    label: `${m.medicine_name} · ${m.quantity} in stock · ${cash(m.unit_price)}`,
  }));

  modal(
    "Record a sale",
    "Complete sale",
    '<div class="field full"><label>Sale items *</label><div id="saleLines"></div><button class="row-action" type="button" id="addLine">＋ Add another item</button></div>',
    async () => {
      const selected = [...document.querySelectorAll(".sale-line")].map((el) => ({
        medicineId: Number(el.querySelector("select").value),
        quantity: Number(el.querySelector("input").value),
      }));

      if (!selected.length) {
        error("Add at least one product.");
        return false;
      }

      const seen = new Set();

      for (const item of selected) {
        const medicine = available.find((m) => Number(m.id) === item.medicineId);

        if (seen.has(item.medicineId)) {
          error("Each medicine can appear once. Adjust its quantity on that row.");
          return false;
        }
        seen.add(item.medicineId);

        if (!medicine || !Number.isInteger(item.quantity) || item.quantity < 1) {
          error("Enter a whole number quantity of at least 1.");
          return false;
        }

        if (item.quantity > Number(medicine.quantity)) {
          error(`${medicine.medicine_name} only has ${medicine.quantity} units in stock.`);
          return false;
        }
      }

      const receiptWindow = window.open("", "_blank");
      const response = await fetch("record_sale.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selected }),
      });

      const result = await response.json();

      if (!response.ok) {
        error(result.error || "Could not record the sale.");
        return false;
      }
      if (receiptWindow) {
  const receiptRows = selected
    .map((item) => {
      const medicine = available.find(
        (m) => Number(m.id) === item.medicineId,
      );
      const unitPrice = Number(medicine.unit_price);

      return `<tr>
        <td>${esc(medicine.medicine_name)}</td>
        <td>${item.quantity}</td>
        <td>${cash(unitPrice)}</td>
        <td>${cash(unitPrice * item.quantity)}</td>
      </tr>`;
    })
    .join("");

  receiptWindow.document.open();
  receiptWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>Receipt ${esc(result.saleNumber)}</title>
        <style>
          body { font: 15px Arial, sans-serif; max-width: 700px; margin: 30px auto; padding: 20px; }
          h1, p { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px 6px; border-bottom: 1px solid #ddd; text-align: left; }
          .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
          @media print { button { display: none; } body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Royal Pharmacy</h1>
        <p>Sales receipt</p>
        <p>Receipt: ${esc(result.saleNumber)}<br>
        Date: ${esc(new Date().toLocaleString())}</p>
        <table>
          <thead><tr><th>Medicine</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
          <tbody>${receiptRows}</tbody>
        </table>
        <p class="total">Total: ${cash(Number(result.total))}</p>
        <p>Thank you for shopping with us.</p>
      </body>
    </html>`);
  receiptWindow.document.close();
  receiptWindow.focus();
  setTimeout(() => receiptWindow.print(), 300);
}

      toast(`Sale ${result.saleNumber} recorded · ${cash(result.total)}`);
      return true;
    },
    "NEW TRANSACTION",
  );

  const add = () => {
    const line = document.createElement("div");
    line.className = "sale-line";
    line.innerHTML = `<select aria-label="Medicine">${opts
      .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`)
      .join("")}</select><input type="number" min="1" value="1" aria-label="Quantity"><button type="button" aria-label="Remove">×</button>`;

    $("#saleLines").append(line);

    line.querySelector("button").onclick = () => {
      line.remove();
      if (!$("#saleLines").children.length) add();
    };
  };

  add();
  $("#addLine").onclick = add;
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
      }) +
      field("address", "Address", {
        value: existing?.address,
        placeholder: "Town or street address",
        full: true,
      }),
    async (fd) => {
      const name = fd.get("name").trim();

      if (!name) {
        error("Enter a supplier name.");
        return false;
      }

      const response = await fetch("supplier_save.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing?.id || null,
          name,
          phone: fd.get("phone").trim(),
          email: fd.get("email").trim(),
          address: fd.get("address").trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        error(result.error || "Could not save the supplier.");
        return false;
      }

      await loadMedicinesFromDatabase();
      toast(existing ? "Supplier updated." : "Supplier added.");
      return true;
    },
  );
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
  $("#form").onsubmit = async (e) => {
  e.preventDefault();

  try {
    const result = await submit(new FormData(e.currentTarget));
    if (result !== false) close();
  } catch (err) {
    error(err.message || "Could not complete the request.");
  }
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
        async (fd) => {
      const name = fd.get("name").trim();
      const category = fd.get("category").trim();
      const quantity = Number(fd.get("quantity"));
      const price = Number(fd.get("price"));

      if (!name || !category) {
        error("Enter the medicine name and category.");
        return false;
      }

      if (!Number.isInteger(quantity) || quantity < 0 || !Number.isFinite(price) || price < 0) {
        error("Quantity and price must be zero or greater.");
        return false;
      }

      const response = await fetch("medicine_save.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing?.id || null,
          name,
          category,
          quantity,
          price,
          supplierId: fd.get("supplier") || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        error(result.error || "Could not save the medicine.");
        return false;
      }

      await loadMedicinesFromDatabase();
      toast(existing ? "Medicine updated." : "Medicine added.");
      return true;
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
async function sales() {
  try {
    const response = await fetch("/pharmacy-store-system/sales_list.php", {
      cache: "no-store",
    });
    const items = await response.json();

    if (!response.ok) {
      throw new Error(items.error || "Could not load sales.");
    }

    const from = $("#salesFrom").value;
    const to = $("#salesTo").value;

    if (from && to && from > to) {
      $("#salesReportSummary").textContent =
        "The start date must be on or before the end date.";
      return;
    }

    const filtered = items.filter((sale) => {
      const saleDay = String(sale.sold_at).slice(0, 10);
      return (!from || saleDay >= from) && (!to || saleDay <= to);
    });

    const revenue = filtered.reduce(
      (sum, sale) => sum + Number(sale.total),
      0,
    );
    const itemCount = filtered.reduce(
      (sum, sale) => sum + Number(sale.quantity),
      0,
    );

    $("#salesRevenue").textContent = cash(revenue);
    $("#salesCount").textContent = filtered.length;
    $("#itemsSold").textContent = itemCount;

    $("#salesRows").innerHTML = filtered
      .map(
        (sale) =>
          `<tr>
            <td><strong>${esc(sale.sale_number)}</strong></td>
            <td>${esc(date(sale.sold_at))}</td>
            <td>${esc(sale.items || "—")}</td>
            <td>${Number(sale.quantity)}</td>
            <td class="money">${cash(sale.total)}</td>
            <td><span class="pill good">Completed</span></td>
          </tr>`,
      )
      .join("");

    $("#salesEmpty").textContent =
      from || to ? "No sales found for those dates." : "No transactions recorded yet.";
    $("#salesEmpty").classList.toggle("hidden", filtered.length > 0);

    $("#salesReportSummary").textContent =
      from || to
        ? `Showing ${filtered.length} sale(s) for the selected dates.`
        : `Showing all ${filtered.length} sales.`;
  } catch (err) {
    $("#salesRows").innerHTML = "";
    $("#salesEmpty").textContent = err.message || "Could not load sales.";
    $("#salesEmpty").classList.remove("hidden");
  }
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
$("#applySalesReport").onclick = sales;

$("#clearSalesReport").onclick = () => {
  $("#salesFrom").value = "";
  $("#salesTo").value = "";
  sales();
};
$("#menu").onclick = () => $("#sidebar").classList.toggle("open");
loadMedicinesFromDatabase().catch((err) => {
  toast(err.message || "Could not load medicines from the database.");
});
