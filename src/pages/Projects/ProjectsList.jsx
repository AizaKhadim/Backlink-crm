import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./ProjectsList.css";
import { doc, deleteDoc, setDoc,getDocs, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role,user } = useUser();
  const navigate = useNavigate();

const handleDeleteProject = async (project) => {
  if (!window.confirm("Are you sure you want to delete this project?")) return;

  try {
    if (role === "admin") {
  const trashRef = doc(collection(db, "projects_trash"));
  await setDoc(trashRef, {
    ...project,
    id: trashRef.id, // ✅ add the generated ID
    deletedAt: serverTimestamp(),
  });

  await deleteDoc(doc(db, "projects", project.id));
  alert("✅ Project moved to trash");
}

    if (role === "editor") {
      await setDoc(doc(collection(db, "delete_requests")), {
        type: "project",
        itemId: project.id,
        projectTitle: project.title || "Untitled",
        requestedBy: user?.name || "Editor",
        status: "Pending_Admin",
        createdAt: serverTimestamp(),
        projectData: { ...project },
      });
      alert("✅ Delete request sent to Admin");
    }

    setProjects(prev => prev.filter(p => p.id !== project.id));
  } catch (error) {
    console.error("Delete error:", error);
    alert("❌ Failed to delete project");
  }
};
  // 🔹 Fetch projects from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, "projects"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="project-list-page">
      <h2>All Projects</h2>

      {(role === "admin" || role === "editor") && (
        <Link to="/projects/create" className="create-project-link">
          ➕ Create New Project
        </Link>
      )}

      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        projects.map((project, index) => (
          <div className="project-card" key={project.id}>
            
            {/* ✅ Numbering Added */}
            <h3>
              {index + 1}. {project.title}
            </h3>

            <p><strong>Website:</strong> {project.website}</p>

            {/* 🔹 View Info Button */}
            <Link
              to={`/projects/info/${project.id}`}
              className="view-info-btn"
            >
              ℹ️ View Info
            </Link>

            {/* Existing Backlink Page Link */}
            <Link to={`/projects/${project.id}`}>
              🔗 View Backlinks
            </Link>
            <div className="project-actions">
              {(role === "admin" || role === "editor") && (
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteProject(project)}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
          
        ))
      )}
    </div>
  );
};

export default ProjectList;
