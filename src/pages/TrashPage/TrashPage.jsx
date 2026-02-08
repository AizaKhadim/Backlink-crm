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

  useEffect(() => {
    if (role !== "admin") return;

    const fetchTrash = async () => {
      const snap = await getDocs(collection(db, "backlinks_trash"));
      setTrashedLinks(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    };

    fetchTrash();
  }, [role]);

  // ♻️ RESTORE
  const handleRestore = async (link) => {
  try {
    // Restore to project
    await setDoc(
      doc(db, "projects", link.projectId, link.category, link.globalId),
      { ...link, isSaved: true }
    );

    // Remove from trash
    await deleteDoc(doc(db, "backlinks_trash", link.globalId));
setTrashedLinks(prev => prev.filter(l => l.globalId !== link.globalId));


    alert("♻️ Restored successfully");
  } catch (err) {
    console.error(err);
    alert("Restore failed");
  }
};




  // ❌ PERMANENT DELETE
  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Delete permanently?")) return;

    await deleteDoc(doc(db, "backlinks_trash", id));
    setTrashedLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="trash-page">
      <h2>🗑 Trashed Backlinks</h2>

      {trashedLinks.length === 0 ? (
        <p>No trashed backlinks</p>
      ) : (
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
                <td data-label="Project">{l.projectId}</td>
                <td data-label="Category">{l.category}</td>
                <td data-label="Status">{l.status}</td>
                <td>
                  <button onClick={() => handleRestore(l)}>♻️ Restore</button>
                  <button onClick={() => handlePermanentDelete(l.id)}>
                    ❌ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TrashPage;
