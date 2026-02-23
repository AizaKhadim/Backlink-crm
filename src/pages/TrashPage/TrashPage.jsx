import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./TrashPage.css";

const TrashPage = () => {
  const { role } = useUser();

  const [trashedLinks, setTrashedLinks] = useState([]);
  const [trashedGlobalLinks, setTrashedGlobalLinks] = useState([]);
  const [trashedProjects, setTrashedProjects] = useState([]);

  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreType, setRestoreType] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (role !== "admin") return;

    const fetchTrash = async () => {
      try {
        const snap = await getDocs(collection(db, "backlinks_trash"));
        const trashData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const projectSnap = await getDocs(collection(db, "projects"));
        const projects = projectSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().title,
        }));
        const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

        // Split project-linked vs global
        const projectLinks = [];
        const globalLinks = [];

        trashData.forEach((link) => {
          if (link.projectId) {
            projectLinks.push({
              ...link,
              projectName: projectMap[link.projectId] || link.projectId,
            });
          } else {
            globalLinks.push(link); // global backlink
          }
        });

        setTrashedLinks(projectLinks);
        setTrashedGlobalLinks(globalLinks);

        const projSnap = await getDocs(collection(db, "projects_trash"));
        const projData = projSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTrashedProjects(projData);
      } catch (err) {
        console.error("Trash fetch error:", err);
      }
    };

    fetchTrash();
  }, [role]);

  const handleRestore = async () => {
    if (!restoreTarget) return;

    try {
      if (restoreType === "backlink") {
        const link = restoreTarget;
        const docId = link.globalId || link.id;

        if (link.projectId) {
          // project-linked
          await setDoc(
            doc(db, "projects", link.projectId, link.category || "Uncategorized", docId),
            { ...link, isSaved: true, restoredAt: new Date() }
          );
        } else {
          // global
          await setDoc(doc(db, "backlinks_all", docId), { ...link, restoredAt: new Date() });
        }

        await deleteDoc(doc(db, "backlinks_trash", link.id));

        // remove from correct state
        if (link.projectId) {
          setTrashedLinks((prev) => prev.filter((l) => l.id !== link.id));
        } else {
          setTrashedGlobalLinks((prev) => prev.filter((l) => l.id !== link.id));
        }
      }

      if (restoreType === "project") {
        const project = restoreTarget;
        await setDoc(doc(db, "projects", project.id), { ...project, restoredAt: new Date() });
        await deleteDoc(doc(db, "projects_trash", project.id));
        setTrashedProjects((prev) => prev.filter((p) => p.id !== project.id));
      }

      setShowRestoreModal(false);
      setRestoreTarget(null);
      setRestoreType(null);
      alert("♻️ Restored successfully!");
    } catch (err) {
      console.error("Restore failed:", err);
      alert("❌ Restore failed");
    }
  };

  const handlePermanentDelete = async (item, type) => {
    if (!item?.id) return alert("❌ Cannot delete: missing ID!");
    if (!window.confirm("Permanently delete? This cannot be undone.")) return;

    try {
      if (type === "backlink") {
        await deleteDoc(doc(db, "backlinks_trash", item.id));
        if (item.projectId) {
          setTrashedLinks((prev) => prev.filter((l) => l.id !== item.id));
        } else {
          setTrashedGlobalLinks((prev) => prev.filter((l) => l.id !== item.id));
        }
      }
      if (type === "project") {
        await deleteDoc(doc(db, "projects_trash", item.id));
        setTrashedProjects((prev) => prev.filter((p) => p.id !== item.id));
      }
      alert("🗑️ Permanently deleted!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete.");
    }
  };

  return (
    <div className="trash-page">
      <h2>🗑 Trash</h2>

      {/* Project-linked Backlinks */}
      <h3>Trashed Backlinks (Project-linked)</h3>
      {trashedLinks.length === 0 ? (
        <p>No trashed project-linked backlinks</p>
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
                      <button onClick={() => handlePermanentDelete(l, "backlink")}>❌ Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Global Backlinks */}
      <h3 style={{ marginTop: 40 }}>Trashed Backlinks (Global)</h3>
      {trashedGlobalLinks.length === 0 ? (
        <p>No trashed global backlinks</p>
      ) : (
        <div className="trash-table-wrapper">
          <table className="trash-table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trashedGlobalLinks.map((l) => (
                <tr key={l.id}>
                  <td data-label="Website">{l.website}</td>
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
                      <button onClick={() => handlePermanentDelete(l, "backlink")}>❌ Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects */}
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
                      <button onClick={() => handlePermanentDelete(p, "project")}>❌ Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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