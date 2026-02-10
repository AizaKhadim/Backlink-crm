import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./ProjectsList.css";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useUser();

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
          </div>
        ))
      )}
    </div>
  );
};

export default ProjectList;
