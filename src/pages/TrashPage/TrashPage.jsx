import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./TrashPage.css";

const TrashPage = () => {
  const { role } = useUser();

  const [trashedLinks, setTrashedLinks] = useState([]);
  const [trashedProjects, setTrashedProjects] = useState([]);

  // 🔹 Modal state
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreType, setRestoreType] = useState(null); // NEW
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // =====================================================
  // 🔹 FETCH TRASH (Backlinks + Projects)
  // =====================================================
  useEffect(() => {
    if (role !== "admin") return;

    const fetchTrash = async () => {
      try {
        // ✅ backlinks trash
        const snap = await getDocs(collection(db, "backlinks_trash"));
        const trashData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // project names
        const projectSnap = await getDocs(collection(db, "projects"));
        const projects = projectSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().title,
        }));
        const projectMap = Object.fromEntries(
          projects.map((p) => [p.id, p.name])
        );

        const finalData = trashData.map((link) => ({
          ...link,
          projectName: projectMap[link.projectId] || link.projectId,
        }));

        setTrashedLinks(finalData);

        // ✅ projects trash (NEW)
        const projSnap = await getDocs(collection(db, "projects_trash"));
        const projData = projSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setTrashedProjects(projData);
      } catch (err) {
        console.error("Trash fetch error:", err);
      }
    };

    fetchTrash();
  }, [role]);

  // =====================================================
  // 🔹 RESTORE HANDLER (SMART)
  // =====================================================
  const handleRestore = async () => {
    if (!restoreTarget) return;

    try {
      // ============================================
      // 🔥 BACKLINK RESTORE
      // ============================================
      if (restoreType === "backlink") {
        const link = restoreTarget;

        const projectId = link.projectId;
        const category = link.category || "Uncategorized";
        const docId = link.globalId || link.id;

        if (!projectId) {
          alert("❌ Restore failed: Project ID missing!");
          return;
        }

        await setDoc(
          doc(db, "projects", projectId, category, docId),
          {
            ...link,
            isSaved: true,
            restoredAt: new Date(),
          }
        );

        await deleteDoc(doc(db, "backlinks_trash", link.id));

        setTrashedLinks((prev) => prev.filter((l) => l.id !== link.id));
      }

      // ============================================
      // 🔥 PROJECT RESTORE (NEW)
      // ============================================
      if (restoreType === "project") {
        const project = restoreTarget;

        await setDoc(doc(db, "projects", project.id), {
          ...project,
          restoredAt: new Date(),
        });

        await deleteDoc(doc(db, "projects_trash", project.id));

        setTrashedProjects((prev) =>
          prev.filter((p) => p.id !== project.id)
        );
      }

      setShowRestoreModal(false);
      setRestoreTarget(null);
      setRestoreType(null);

      alert("♻️ Restored successfully!");
    } catch (err) {
      console.error("❌ Restore failed:", err);
      alert("❌ Restore failed");
    }
  };

  // =====================================================
  // 🔹 PERMANENT DELETE
  // =====================================================
 const handlePermanentDelete = async (item, type) => {
  try {
    const itemId = item?.id;

    if (!itemId) {
      alert("❌ Cannot delete: item ID missing!");
      console.error("Delete failed — item:", item);
      return;
    }

    if (!window.confirm("Permanently delete this item? This cannot be undone.")) {
      return;
    }

    // 🔹 BACKLINK
    if (type === "backlink") {
      await deleteDoc(doc(db, "backlinks_trash", itemId));
      setTrashedLinks(prev => prev.filter(i => i.id !== itemId));
    }

    // 🔹 PROJECT
    if (type === "project") {
      await deleteDoc(doc(db, "projects_trash", itemId));
      setTrashedProjects(prev => prev.filter(i => i.id !== itemId));
    }

    alert("🗑️ Permanently deleted!");

  } catch (error) {
    console.error("Permanent delete error:", error);
    alert("❌ Failed to permanently delete.");
  }
};
  return (
    <div className="trash-page">
      <h2>🗑 Trash</h2>

      {/* ================================================= */}
      {/* 🔥 BACKLINKS SECTION */}
      {/* ================================================= */}
      <h3>Trashed Backlinks</h3>

      {trashedLinks.length === 0 ? (
        <p>No trashed backlinks</p>
      ) : (
        <div className="trash-table-wrapper">
          <table className="trash-table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Project</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {trashedLinks.map((l) => (
                <tr key={l.id}>
                  <td data-label="Website">{l.website}</td>
                  <td data-label="Project">{l.projectName}</td>
                  <td data-label="Category">{l.category}</td>
                  <td data-label="Status">{l.status}</td>
                  <td>
                    <button
                      onClick={() => {
                        setRestoreTarget(l);
                        setRestoreType("backlink");
                        setShowRestoreModal(true);
                      }}
                    >
                      ♻️ Restore
                    </button>

                    {role === "admin" && (
                      <button
                        onClick={() =>
                          handlePermanentDelete(l, "backlink")
                        }
                      >
                        ❌ Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================================================= */}
      {/* 🔥 PROJECTS SECTION (NEW) */}
      {/* ================================================= */}
      <h3 style={{ marginTop: 40 }}>Trashed Projects</h3>

      {trashedProjects.length === 0 ? (
        <p>No trashed projects</p>
      ) : (
        <div className="trash-table-wrapper">
          <table className="trash-table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Website</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {trashedProjects.map((p) => (
                <tr key={p.id}>
                  <td data-label="Title">{p.title}</td>
                  <td data-label="Website">{p.website}</td>
                  <td>
                    <button
                      onClick={() => {
                        setRestoreTarget(p);
                        setRestoreType("project");
                        setShowRestoreModal(true);
                      }}
                    >
                      ♻️ Restore
                    </button>

                    {role === "admin" && (
                      <button
                        onClick={() =>
                          handlePermanentDelete(p, "project")
                        }
                      >
                        ❌ Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================================================= */}
      {/* 🔹 RESTORE MODAL */}
      {/* ================================================= */}
      {showRestoreModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Are you sure you want to restore this item?</h3>
            <div className="modal-actions">
              <button onClick={handleRestore}>Yes</button>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreTarget(null);
                  setRestoreType(null);
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashPage;