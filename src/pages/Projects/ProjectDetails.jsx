import React, { useEffect, useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./ProjectDetails.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const backlinkCategories = [
  "Guest Posting",
  "Profile Creation",
  "Micro Blogging",
  "Directory Submission",
  "Social Bookmarks",
];

const statusOptions = ["error", "completed", "under_review"];

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [activeCategory, setActiveCategory] = useState("");
  const [categoryLinks, setCategoryLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const snap = await getDoc(doc(db, "projects", id));
    if (snap.exists()) setProject(snap.data());
    setLoading(false);
  };

  // ================= CATEGORY CLICK =================
  const handleCategoryClick = async (cat) => {
    setActiveCategory(cat);
    setLoading(true);

    const trashSnap = await getDocs(collection(db, "backlinks_trash"));
    const trashedIds = trashSnap.docs
      .filter((d) => d.data().projectId === id && d.data().category === cat)
      .map((d) => d.id);

    const globalSnap = await getDocs(collection(db, "backlinks_all"));
    const globalLinks = globalSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (l) =>
          Array.isArray(l.categories) &&
          l.categories.includes(cat) &&
          !trashedIds.includes(l.id)
      );

    const projectSnap = await getDocs(collection(db, "projects", id, cat));
    const projectSaved = projectSnap.docs
      .map((d) => ({ ...d.data(), isSaved: true }))
      .filter((l) => !trashedIds.includes(l.globalId));

    const merged = globalLinks.map((gl) => {
      const saved = projectSaved.find((p) => p.globalId === gl.id);
      return (
        saved || {
          globalId: gl.id,
          website: gl.website || "",
          da: gl.da || "",
          spamScore: gl.spamScore || "",
          username: "",
          password: "",
          link: "",
          keyword: "",
          status: gl.status || "under_review",
          notes: gl.notes || "",
          // guest posting extras
          dr: "",
          traffic: "",
          email: "",
          price: "",
          niche: "",
          publishedUrl: "",
          isSaved: false,
        }
      );
    });

    setCategoryLinks(merged);
    setLoading(false);
  };

  // ================= EXPORT =================
  const handleExport = () => {
    if (!categoryLinks || categoryLinks.length === 0) {
      alert("No backlinks to export!");
      return;
    }

    const dataToExport = categoryLinks.map((link) => {
      const base = {
        Website: link.website,
        DA: link.da,
        Spam: link.spamScore,
        Status: link.status,
        Notes: link.notes,
      };

      if (activeCategory === "Guest Posting") {
        base.DR = link.dr;
        base.Traffic = link.traffic;
        base.Email = link.email;
        base.Price = link.price;
        base.Niche = link.niche;
        base.PublishedURL = link.publishedUrl;
      }

      return base;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Backlinks");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Backlinks-${activeCategory}.xlsx`);
  };

  // ================= LOCAL CHANGE =================
  const handleChange = (idx, field, value) => {
    const updated = [...categoryLinks];
    updated[idx][field] = value;
    setCategoryLinks(updated);
  };

  // ================= UPDATE =================
  const handleUpdate = async (link) => {
    try {
      await setDoc(doc(db, "projects", id, activeCategory, link.globalId), link, {
        merge: true,
      });
      await setDoc(
        doc(db, "backlinks_all", link.globalId),
        { status: link.status, notes: link.notes || "" },
        { merge: true }
      );
      setEditingId(null);
      alert("✅ Updated");
    } catch {
      alert("❌ Update failed");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (link) => {
    if (!window.confirm("Move backlink to Trash?")) return;

    try {
      await setDoc(doc(db, "backlinks_trash", link.globalId), {
        ...link,
        projectId: id,
        category: activeCategory,
        deletedAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, "projects", id, activeCategory, link.globalId));
      setCategoryLinks((prev) => prev.filter((l) => l.globalId !== link.globalId));
      alert("✅ Moved to Trash");
    } catch {
      alert("❌ Failed to move to trash");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="project-details-page">
      <h2>{project?.title}</h2>

      <div className="category-buttons">
        {backlinkCategories.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? "active" : ""}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
        {activeCategory && (
          <button className="export-btn" onClick={handleExport}>
            Export
          </button>
        )}
      </div>

      {activeCategory && categoryLinks.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Website</th>
                <th>DA</th>
                <th>Spam</th>

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
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {categoryLinks.map((link, idx) => (
                <tr key={link.globalId}>
                  <td>{link.website}</td>
                  <td>{link.da}</td>
                  <td>{link.spamScore}</td>

                  {activeCategory === "Guest Posting" && (
                    <>
                      <td>
                        {editingId === link.globalId ? (
                          <input
                            value={link.dr}
                            onChange={(e) => handleChange(idx, "dr", e.target.value)}
                          />
                        ) : (
                          link.dr || "-"
                        )}
                      </td>
                      <td>
                        {editingId === link.globalId ? (
                          <input
                            value={link.traffic}
                            onChange={(e) => handleChange(idx, "traffic", e.target.value)}
                          />
                        ) : (
                          link.traffic || "-"
                        )}
                      </td>
                      <td>
                        {editingId === link.globalId ? (
                          <input
                            value={link.email}
                            onChange={(e) => handleChange(idx, "email", e.target.value)}
                          />
                        ) : (
                          link.email || "-"
                        )}
                      </td>
                      <td>
                        {editingId === link.globalId ? (
                          <input
                            value={link.price}
                            onChange={(e) => handleChange(idx, "price", e.target.value)}
                          />
                        ) : (
                          link.price || "-"
                        )}
                      </td>
                      <td>
                        {editingId === link.globalId ? (
                          <input
                            value={link.niche}
                            onChange={(e) => handleChange(idx, "niche", e.target.value)}
                          />
                        ) : (
                          link.niche || "-"
                        )}
                      </td>
                      <td>
                        {editingId === link.globalId ? (
                          <input
                            value={link.publishedUrl}
                            onChange={(e) =>
                              handleChange(idx, "publishedUrl", e.target.value)
                            }
                          />
                        ) : (
                          link.publishedUrl || "-"
                        )}
                      </td>
                    </>
                  )}

                  {/* STATUS */}
                  <td>
                    {editingId === link.globalId ? (
                      <select
                        value={link.status}
                        onChange={(e) => handleChange(idx, "status", e.target.value)}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      link.status
                    )}
                  </td>

                  {/* NOTES */}
                  <td>
                    {editingId === link.globalId ? (
                      <input
                        value={link.notes}
                        onChange={(e) => handleChange(idx, "notes", e.target.value)}
                      />
                    ) : (
                      link.notes || "-"
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="actions-col">
                    {editingId === link.globalId ? (
                      <>
                        <button onClick={() => handleUpdate(link)}>💾 Save</button>
                        <button onClick={() => setEditingId(null)}>❌ Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditingId(link.globalId)}>✏️ Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(link)}>
                          🗑 Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
