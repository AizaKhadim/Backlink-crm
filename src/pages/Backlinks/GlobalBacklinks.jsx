import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./GlobalBacklinks.css";

const categoriesList = [
  "Guest Posting",
  "Profile Creation",
  "Micro Blogging",
  "Directory Submission",
  "Social Bookmarks",
];

const statusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "under_review", label: "Under Review" },
  { value: "completed", label: "Completed" },
  { value: "error", label: "Error" },
];

const GlobalBacklinks = () => {
  const { role } = useUser();
  const [activeCategory, setActiveCategory] = useState("all");
  const [backlinks, setBacklinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importReport, setImportReport] = useState([]);
  const [showImportReport, setShowImportReport] = useState(false);


  // Modal
  const [showModal, setShowModal] = useState(false);

  // Form for adding backlink
  const [formData, setFormData] = useState({
    website: "",
    da: "",
    spamScore: "",
    dr: "",
    traffic: "",
    email: "",
    price: "",
    niche: "",
    publishedUrl: "",
    categories: [],
    status: "not_started",
    notes: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Editable row state
  const [editableRowId, setEditableRowId] = useState(null);
  const [editableRowData, setEditableRowData] = useState({});

  // Fetch backlinks
  const fetchBacklinks = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "backlinks_all"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBacklinks(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBacklinks();
  }, []);

  const isDuplicateBacklink = async (website, category) => {
    const q = query(
      collection(db, "backlinks_all"),
      where("website", "==", website),
      where("categories", "array-contains", category)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const toggleCategory = (cat) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories };
    });
  };

  // Add new backlink (admin only)
  const handleAddBacklink = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (role !== "admin") {
      setError("❌ Only admins can add backlinks");
      return;
    }

    if (!formData.website || formData.categories.length === 0) {
      setError("Website and at least one category are required");
      return;
    }

    for (const cat of formData.categories) {
      const duplicate = await isDuplicateBacklink(formData.website.trim(), cat);
      if (duplicate) {
        setError(`❌ Duplicate backlink in category "${cat}"`);
        return;
      }
    }

    try {
      await addDoc(collection(db, "backlinks_all"), {
        ...formData,
        website: formData.website.trim(),
        createdAt: new Date(),
        databaseName: "All Backlinks",
      });

      setSuccess("✅ Backlink added successfully!");
      setFormData({
        website: "",
        da: "",
        spamScore: "",
        dr: "",
        traffic: "",
        email: "",
        price: "",
        niche: "",
        publishedUrl: "",
        categories: [],
        status: "not_started",
        notes: "",
      });

      fetchBacklinks();
      setTimeout(() => setShowModal(false), 800);
    } catch (err) {
      console.error(err);
      setError("❌ Failed to add backlink");
    }
  };

  // Toggle edit mode
  const toggleEdit = (link) => {
    if (editableRowId === link.id) {
      saveEditableRow(link.id); // Save changes
    } else {
      setEditableRowId(link.id);
      setEditableRowData({ ...link }); // copy current row data
    }
  };

  // Save editable row to Firestore
  const saveEditableRow = async (id) => {
    try {
      const docRef = doc(db, "backlinks_all", id);
      await updateDoc(docRef, { ...editableRowData });
      setEditableRowId(null);
      fetchBacklinks();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  // Export to Excel
  const handleExport = () => {
    if (!backlinks || backlinks.length === 0) {
      alert("No backlinks to export!");
      return;
    }

    // Filter by active category
    const filtered = backlinks.filter(
      (link) =>
        activeCategory === "all" ||
        (Array.isArray(link.categories) && link.categories.includes(activeCategory))
    );

    const dataToExport = filtered.map((link) => ({
      Website: link.website || "",
      DA: link.da || "",
      SpamScore: link.spamScore || "",
      DR: link.dr || "",
      Traffic: link.traffic || "",
      Email: link.email || "",
      Price: link.price || "",
      Niche: link.niche || "",
      PublishedURL: link.publishedUrl || "",
      Status: link.status || "",
      Notes: link.notes || "",
      Categories: Array.isArray(link.categories) ? link.categories.join(", ") : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Backlinks");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Backlinks-${activeCategory}.xlsx`);
  };

  // Import from Excel
 const handleImport = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setImportLoading(true);
  setImportReport([]);
  setShowImportReport(false);
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

    const requiredColumns = [
      "Website",
      "DA",
      "SpamScore",
      "Notes",
      "Status",
      "Categories",
    ];

    const missingColumns = requiredColumns.filter(
      (col) => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      alert(`❌ Missing columns: ${missingColumns.join(", ")}`);
      setImportLoading(false);
      return;
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    let addedCount = 0;
    let skippedCount = 0;
    const sessionWebsites = new Set();
    const report = [];

    // 🔹 Get existing backlinks once (avoid per-row query)
    const existingSnapshot = await getDocs(collection(db, "backlinks_all"));
    const existingData = existingSnapshot.docs.map((doc) => doc.data());

    for (const row of rows) {
      const websiteRaw = row.Website?.toString().trim();

      if (!websiteRaw) {
        skippedCount++;
        report.push({ website: "Empty", reason: "Website missing" });
        continue;
      }

      const website = websiteRaw.toLowerCase();

      if (!row.Categories) {
        skippedCount++;
        report.push({ website, reason: "Categories missing" });
        continue;
      }

      const categories = row.Categories.toString()
        .split(",")
        .map((c) => c.trim())
        .filter((c) =>
          categoriesList.some(
            (valid) => valid.toLowerCase() === c.toLowerCase()
          )
        )
        .map((c) =>
          categoriesList.find(
            (valid) => valid.toLowerCase() === c.toLowerCase()
          )
        );

      if (categories.length === 0) {
        skippedCount++;
        report.push({ website, reason: "Invalid categories" });
        continue;
      }

      if (sessionWebsites.has(website)) {
        skippedCount++;
        report.push({ website, reason: "Duplicate in same file" });
        continue;
      }

      // 🔹 Duplicate check against existing DB
      const duplicate = existingData.some(
        (link) =>
          link.website?.toLowerCase() === website &&
          link.categories?.some((cat) => categories.includes(cat))
      );

      if (duplicate) {
        skippedCount++;
        report.push({ website, reason: "Already exists in database" });
        continue;
      }

      await addDoc(collection(db, "backlinks_all"), {
        website,
        da: row.DA || "",
        spamScore: row.SpamScore || "",
        dr: row.DR || "",
        traffic: row.Traffic || "",
        email: row.Email || "",
        price: row.Price || "",
        niche: row.Niche || "",
        publishedUrl: row.PublishedURL || "",
        status: row.Status || "under_review",
        notes: row.Notes || "",
        categories,
        createdAt: new Date(),
        databaseName: "All Backlinks",
      });

      addedCount++;
      sessionWebsites.add(website);
    }

    await fetchBacklinks();
    setImportReport(report);
    alert(`✅ Import finished — Added: ${addedCount}, Skipped: ${skippedCount}`);
  } catch (err) {
    console.error("Import error:", err);
    alert("❌ Import failed");
  }

  setImportLoading(false);
  e.target.value = "";
};
  // Filtered list
   const filtered = backlinks.filter(
    (link) =>
      !link.deleted &&
      (activeCategory === "all" ||
        (Array.isArray(link.categories) && link.categories.includes(activeCategory))) &&
      link.website?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Toggle single checkbox
const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((l) => l.id));
    }
  };
const handleDelete = async (link) => {
  if (!window.confirm("Move to trash?")) return;

  try {
    if (!link?.id) {
      alert("❌ Link ID missing!");
      return;
    }

    // 🔹 Only pick needed fields
    const linkData = {
      website: link.website || "",
      da: link.da || "",
      spamScore: link.spamScore || "",
      dr: link.dr || "",
      traffic: link.traffic || "",
      email: link.email || "",
      price: link.price || "",
      niche: link.niche || "",
      publishedUrl: link.publishedUrl || "",
      status: link.status || "",
      notes: link.notes || "",
      categories: Array.isArray(link.categories) ? link.categories : [],
      projectId: link.projectId || null,
      deletedAt: new Date(),
    };

    await addDoc(collection(db, "backlinks_trash"), linkData);

    await updateDoc(doc(db, "backlinks_all", link.id), {
      deleted: true,
    });

    fetchBacklinks();
  } catch (err) {
    console.error("❌ Failed to move backlink to trash:", err);
    alert("❌ Failed to move backlink to trash.");
  }
};

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Delete selected backlinks?")) return;

    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const link = backlinks.find((l) => l.id === id);
          if (!link) return;

          await addDoc(collection(db, "backlinks_trash"), {
            ...link,
            deletedAt: new Date(),
          });

          await updateDoc(doc(db, "backlinks_all", id), {
            deleted: true,
          });
        })
      );

      setSelectedIds([]);
      fetchBacklinks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="global-backlinks-page">
      <h2>Main Database (all websites)</h2>

      
      {/* Scrollable Modal */}
      {showModal && role === "admin" && (
        <div className="modal-overlay">
          <div className="modal-content scrollable-modal">
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>
              ×
            </button>
            <h3>Add New Backlink</h3>
            <div className="backlink-form">
              <input
                placeholder="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />

              <div className="category-checkboxes">
                {categoriesList.map((cat) => (
                  <label key={cat}>
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>

              {formData.categories.includes("Guest Posting") ? (
                <>
                  <input
                    placeholder="DA"
                    value={formData.da}
                    onChange={(e) => setFormData({ ...formData, da: e.target.value })}
                  />
                  <input
                    placeholder="Spam Score"
                    value={formData.spamScore}
                    onChange={(e) => setFormData({ ...formData, spamScore: e.target.value })}
                  />
                  <input
                    placeholder="DR"
                    value={formData.dr}
                    onChange={(e) => setFormData({ ...formData, dr: e.target.value })}
                  />
                  <input
                    placeholder="Traffic"
                    value={formData.traffic}
                    onChange={(e) => setFormData({ ...formData, traffic: e.target.value })}
                  />
                  <input
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <input
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <input
                    placeholder="Niche"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  />
                  <input
                    placeholder="Published URL"
                    value={formData.publishedUrl}
                    onChange={(e) => setFormData({ ...formData, publishedUrl: e.target.value })}
                  />
                   <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="under_review">Under Review</option>
                      <option value="completed">Completed</option>
                      <option value="error">Error</option>
                    </select>
                  <textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </>
              ) : (
                formData.categories.length > 0 && (
                  <>
                    <input
                      placeholder="DA"
                      value={formData.da}
                      onChange={(e) => setFormData({ ...formData, da: e.target.value })}
                    />
                    <input
                      placeholder="Spam Score"
                      value={formData.spamScore}
                      onChange={(e) => setFormData({ ...formData, spamScore: e.target.value })}
                    />
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="under_review">Under Review</option>
                      <option value="completed">Completed</option>
                      <option value="error">Error</option>
                    </select>
                    <textarea
                      placeholder="Notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </>
                )
              )}

              <button onClick={handleAddBacklink}>Add Backlink</button>
              {success && <p className="success-text">{success}</p>}
              {error && <p className="error-text">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeCategory === "all" ? "active" : ""}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        {categoriesList.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? "active" : ""}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        placeholder="Search by website..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Export / Import */}
      {role === "admin" && (
        <div className="import-export-bar">
           <button
          className="export-btn"
          onClick={() => {
            setShowModal(true);
            setSuccess("");
            setError("");
          }}
        >
          Add Website
        </button>
          <button className="export-btn" onClick={handleExport}>
            Export
          </button>
          <label className="import-btn">
          {importLoading ? "Importing..." : "Import"}
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{ display: "none" }}
            onChange={handleImport}
            disabled={importLoading}
          />
        </label>
          <button
          className="import-guidelines-btn"
          onClick={() => setShowImportGuide(!showImportGuide)}
        >
          {showImportGuide ? "Hide Import Guidelines" : "View Import Guidelines"}
        </button>
        {importReport.length > 0 && (
  <div className="import-export-bar">
    <button
      className="import-btn"
      onClick={() => setShowImportReport((prev) => !prev)}
    >
      {showImportReport
        ? "Hide Skipped Records"
        : `View Skipped Records (${importReport.length})`}
    </button>

    {showImportReport && (
      <div className="import-report">
        <h4>Skipped Records:</h4>
        <ul>
          {importReport.map((r, i) => (
            <li key={i}>
              {r.website} — {r.reason}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
            {role === "admin" && selectedIds.length > 0 && (
      <button className="delete-btn" onClick={handleBulkDelete}>
        Delete Selected ({selectedIds.length})
      </button>
    )}

        </div>
      )}
        {showImportGuide && (
  <div className="import-help-card">
    <h4>📥 Import Format Guide</h4>

    <p className="import-note">
      Your Excel file <strong>must</strong> contain the following headers.
      Header names are <strong>case-sensitive</strong>.
    </p>

    <h5>Required Columns (Must be present)</h5>
    <div className="import-table">
      <table>
        <thead>
          <tr>
            <th>
            <input
              type="checkbox"
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
            />
          </th>
            <th>Website</th>
            <th>DA</th>
            <th>SpamScore</th>
            <th>Notes</th>
            <th>Status</th>
            <th>Categories</th>
          </tr>
        </thead>
      </table>
    </div>

    <h5>Guest Posting (Optional but Recommended)</h5>
    <div className="import-table">
      <table>
        <thead>
          <tr>
            <th>DR</th>
            <th>Traffic</th>
            <th>Email</th>
            <th>Price</th>
            <th>Niche</th>
            <th>PublishedURL</th>
          </tr>
        </thead>
      </table>
    </div>

    <p className="import-note small">
      Categories can be comma separated.<br />
      Example: <code>Guest Posting, Profile Creation</code>
    </p>
  </div>
)}


      {/* Table */}
     {loading ? (
  <p>Loading...</p>
) : filtered.length === 0 ? (
  <p>No backlinks found</p>
) : (
  <div className="table-wrapper">
    <table>
      <thead>
       
        <tr>
           <th>
          <input
             type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                  />
        </th>
          <th>Sr #</th> {/* ✅ NEW */}
          <th className="col-categories">Website</th>

          {activeCategory === "all" && (
            <th className="col-categories">Categories</th>
          )}

          <th>DA</th>
          <th>Spam</th>

          {/* 👇 Guest Posting extra headers */}
          {activeCategory === "Guest Posting" && (
            <>
              <th>DR</th>
              <th>Traffic</th>
              <th>Email</th>
              <th>Price</th>
              <th>Niche</th>
              <th>Published URL</th>
            </>
          )}

          <th>Status</th>
          <th>Notes</th>

          {role === "admin" && <th>Action</th>}
        </tr>
      </thead>

      <tbody>
        {filtered.map((link ,index) => (
          <tr key={link.id}>
            <td>
        <input
          type="checkbox"
          checked={selectedIds.includes(link.id)}
          onChange={() => toggleSelect(link.id)}
        />
      </td>
      <td>{index + 1}</td>
            {/* Website */}
            <td className="bold-cell">
              {editableRowId === link.id ? (
                <input className="col-categories"
                  value={editableRowData.website || ""}
                  onChange={(e) =>
                    setEditableRowData({
                      ...editableRowData,
                      website: e.target.value,
                    })
                  }
                />
              ) : (
                link.website
              )}
            </td>

            {/* Categories (ALL tab only) */}
           {activeCategory === "all" && (
  <td className="col-categories">
    {editableRowId === link.id ? (
      <select
        multiple
        value={editableRowData.categories || []}
        onChange={(e) =>
          setEditableRowData({
            ...editableRowData,
            categories: Array.from(
              e.target.selectedOptions,
              (opt) => opt.value
            ),
          })
        }
      >
        {categoriesList.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    ) : (
      link.categories?.join(", ")
    )}
  </td>
)}

            {/* DA */}
            <td className="bold-cell">
              {editableRowId === link.id ? (
                <input
                  value={editableRowData.da || ""}
                  onChange={(e) =>
                    setEditableRowData({
                      ...editableRowData,
                      da: e.target.value,
                    })
                  }
                />
              ) : (
                link.da
              )}
            </td>

            {/* Spam */}
            <td className="bold-cell">
              {editableRowId === link.id ? (
                <input
                  value={editableRowData.spamScore || ""}
                  onChange={(e) =>
                    setEditableRowData({
                      ...editableRowData,
                      spamScore: e.target.value,
                    })
                  }
                />
              ) : (
                link.spamScore
              )}
            </td>

            {/* 👇 Guest Posting extra columns */}
            {activeCategory === "Guest Posting" && (
              <>
                <td>{link.dr || "-"}</td>
                <td>{link.traffic || "-"}</td>
                <td>{link.email || "-"}</td>
                <td>{link.price || "-"}</td>
                <td>{link.niche || "-"}</td>
                <td>{link.publishedUrl || "-"}</td>
              </>
            )}

            {/* Status */}
            <td>
              {editableRowId === link.id ? (
                <select
                  value={editableRowData.status || ""}
                  onChange={(e) =>
                    setEditableRowData({
                      ...editableRowData,
                      status: e.target.value,
                    })
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                link.status
              )}
            </td>

            {/* Notes */}
            <td>
              {editableRowId === link.id ? (
                <input
                  value={editableRowData.notes || ""}
                  onChange={(e) =>
                    setEditableRowData({
                      ...editableRowData,
                      notes: e.target.value,
                    })
                  }
                />
              ) : (
                link.notes
              )}
            </td>

            {/* Action */}
            {role === "admin" && (
              <td>
                <button
                  className="edit-btn"
                  onClick={() => toggleEdit(link)}
                >
                  {editableRowId === link.id ? "Save" : "Edit"}
                </button>
                <button
      className="delete-btn"
      onClick={() => handleDelete(link)}
    >
      Delete
    </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>


      )}
    </div>
  );
};

export default GlobalBacklinks;
