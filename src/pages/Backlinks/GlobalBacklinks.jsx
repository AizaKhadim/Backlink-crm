import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./GlobalBacklinks.css";

const categoriesList = [
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks",
];

const GlobalBacklinks = () => {
  const { role } = useUser();
  const [activeCategory, setActiveCategory] = useState("all");
  const [backlinks, setBacklinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    status: "under_review",
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
        status: "under_review",
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
// ==========================
const handleExport = () => {
  if (!backlinks || backlinks.length === 0) {
    alert("No backlinks to export!");
    return;
  }

  // Filter by active category
  const filtered = backlinks.filter(
    (link) => activeCategory === "all" || (Array.isArray(link.categories) && link.categories.includes(activeCategory))
  );

  // Map all backlinks to exportable data
  const dataToExport = filtered.map((link) => {
    return {
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
    };
  });

  // Create Excel worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Backlinks");

  // Write workbook to blob and save
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `Backlinks-${activeCategory}.xlsx`);
};

const handleImport = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // 👇 Header validation
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
    return;
  }

  // 👇 Now read rows (empty cells allowed)
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  let addedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    try {
      // Website & Categories must have value
      if (!row.Website || !row.Categories) {
        skippedCount++;
        continue;
      }

      const website = row.Website.toString().trim().toLowerCase();

      const categories = row.Categories
        .toString()
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter((c) => categoriesList.includes(c));

      if (categories.length === 0) {
        skippedCount++;
        continue;
      }

      // Duplicate check
      let duplicate = false;
      for (const cat of categories) {
        const q = query(
          collection(db, "backlinks_all"),
          where("website", "==", website),
          where("categories", "array-contains", cat)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          duplicate = true;
          break;
        }
      }

      if (duplicate) {
        skippedCount++;
        continue;
      }

      // ✅ Add backlink
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
    } catch (err) {
      console.error("Import error:", err);
      skippedCount++;
    }
  }
  await fetchBacklinks();
  e.target.value = "";
  alert(`✅ Import finished — Added: ${addedCount}, Skipped: ${skippedCount}`);
};


  const filtered = backlinks.filter(
    (link) =>
      (activeCategory === "all" ||
        (Array.isArray(link.categories) && link.categories.includes(activeCategory))) &&
      link.website?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="global-backlinks-page">
      <h2>Main Backlinks Database</h2>

      {role === "admin" && (
        <button
          className="open-modal-btn"
          onClick={() => {
            setShowModal(true);
            setSuccess("");
            setError("");
          }}
        >
          Add Backlink
        </button>
      )}

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

              {formData.categories.includes("guest posting") ? (
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

      {/* Export */}
      {role === "admin" && (
  <div className="import-export-bar">
    <button className="export-btn" onClick={handleExport}>Export</button>
    <label className="import-btn">
      Import
      <input
        type="file"
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={handleImport}
      />
    </label>
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
              {activeCategory === "guest posting" ? (
                <>
                  <th>Website</th>
                  <th>DA</th>
                  <th>Spam</th>
                  <th>DR</th>
                  <th>Traffic</th>
                  <th>Email</th>
                  <th>Price</th>
                  <th>Niche</th>
                  <th>Published URL</th>
                  <th>Notes</th>
                  <th>Action</th>
                </>
              ) : (
                <>
                  <th>Website</th>
                  <th>DA</th>
                  <th>Spam</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((link) => (
              <tr key={link.id}>
                {activeCategory === "guest posting" ? (
                  <>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.website || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, website: e.target.value })
                          }
                        />
                      ) : (
                        link.website
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.da || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, da: e.target.value })
                          }
                        />
                      ) : (
                        link.da
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.spamScore || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, spamScore: e.target.value })
                          }
                        />
                      ) : (
                        link.spamScore
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.dr || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, dr: e.target.value })
                          }
                        />
                      ) : (
                        link.dr
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.traffic || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, traffic: e.target.value })
                          }
                        />
                      ) : (
                        link.traffic
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.email || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, email: e.target.value })
                          }
                        />
                      ) : (
                        link.email
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.price || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, price: e.target.value })
                          }
                        />
                      ) : (
                        link.price
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.niche || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, niche: e.target.value })
                          }
                        />
                      ) : (
                        link.niche
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.publishedUrl || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, publishedUrl: e.target.value })
                          }
                        />
                      ) : (
                        link.publishedUrl
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.notes || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, notes: e.target.value })
                          }
                        />
                      ) : (
                        link.notes
                      )}
                    </td>
                    <td>
                      {role === "admin" && (
                        <button className="edit-btn" onClick={() => toggleEdit(link)}>
                          {editableRowId === link.id ? "Save" : "Edit"}
                        </button>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.website || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, website: e.target.value })
                          }
                        />
                      ) : (
                        link.website
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.da || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, da: e.target.value })
                          }
                        />
                      ) : (
                        link.da
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.spamScore || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, spamScore: e.target.value })
                          }
                        />
                      ) : (
                        link.spamScore
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <select
                          value={editableRowData.status || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, status: e.target.value })
                          }
                        >
                          <option value="under_review">Under Review</option>
                          <option value="completed">Completed</option>
                          <option value="error">Error</option>
                        </select>
                      ) : (
                        link.status
                      )}
                    </td>
                    <td>
                      {editableRowId === link.id ? (
                        <input
                          value={editableRowData.notes || ""}
                          onChange={(e) =>
                            setEditableRowData({ ...editableRowData, notes: e.target.value })
                          }
                        />
                      ) : (
                        link.notes
                      )}
                    </td>
                    <td>
                      {role === "admin" && (
                        <button className="edit-btn" onClick={() => toggleEdit(link)}>
                          {editableRowId === link.id ? "Save" : "Edit"}
                        </button>
                      )}
                    </td>
                  </>
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
