import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./ProjectsList.css";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useUser();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, "projects"), where("isDeleted", "==", false));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
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
        projects.map(project => (
          <div className="project-card" key={project.id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <Link to={`/projects/${project.id}`}>View Backlinks</Link>
          </div>
        ))
      )}
    </div>
  );
};

export default ProjectList;
