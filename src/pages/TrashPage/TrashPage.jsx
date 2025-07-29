import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./TrashPage.css";

const TrashPage = () => {
  const { user, role, loading } = useUser();
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [error, setError] = useState("");

  // ✅ Ensure user is loaded before checking role
  useEffect(() => {
    if (loading) return; // wait until loading is false

    if (!user || role !== "admin") {
      setError("Access denied. Only Admins can access the Trash.");
      return;
    }

    const fetchDeletedProjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, "projects"));
        const trashed = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((project) => project.isDeleted === true);
        setDeletedProjects(trashed);
      } catch (err) {
        console.error("Error fetching trashed projects:", err);
        setError("Error loading trash data.");
      }
    };

    fetchDeletedProjects();
  }, [loading, user, role]);

  const handleRestore = async (projectId) => {
  const confirmRestore = window.confirm("Are you sure you want to restore this project?");
  if (!confirmRestore) return;

  try {
    await updateDoc(doc(db, "projects", projectId), {
      isDeleted: false,
    });
    setDeletedProjects(deletedProjects.filter((p) => p.id !== projectId));
  } catch (err) {
    console.error("Error restoring project:", err);
  }
};


  const handlePermanentDelete = async (projectId) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this project?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "projects", projectId));
      setDeletedProjects(deletedProjects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Error permanently deleting project:", err);
    }
  };

  if (loading) return <div>Loading...</div>; // Show loading spinner while waiting
  if (error) return <div className="trash-error">{error}</div>; // Show access or fetch error

  return (
    <div className="trash-page">
      <h2>🗑 Trashed Projects</h2>

      {deletedProjects.length === 0 ? (
        <p>No trashed projects.</p>
      ) : (
        <ul className="trashed-projects-list">
          {deletedProjects.map((project) => (
            <li key={project.id}>
              <strong>{project.title}</strong> — {project.website}
              <div className="trash-actions">
                <button onClick={() => handleRestore(project.id)}>Restore</button>
                <button onClick={() => handlePermanentDelete(project.id)}>Delete Permanently</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrashPage;
