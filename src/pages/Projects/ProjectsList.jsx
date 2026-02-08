import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./ProjectsList.css";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editData, setEditData] = useState({});
  const { role } = useUser();

  // 🔹 Fetch projects from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, "projects"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // 🔹 Handle input change for inline edit
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // 🔹 Save edited project to Firebase
  const handleSaveEdit = async (projectId) => {
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, { ...editData });
      // Update local state
      setProjects(projects.map(p => (p.id === projectId ? { ...p, ...editData } : p)));
      setEditingProjectId(null);
      setEditData({});
    } catch (err) {
      console.error("Error updating project:", err);
      alert("Failed to save changes.");
    }
  };

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
            {editingProjectId === project.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  name="title"
                  value={editData.title || project.title}
                  onChange={handleInputChange}
                  placeholder="Project Title"
                />
                <input
                  type="text"
                  name="website"
                  value={editData.website || project.website}
                  onChange={handleInputChange}
                  placeholder="Project Website"
                />
                <input
                  type="email"
                  name="email"
                  value={editData.email || project.email || ""}
                  onChange={handleInputChange}
                  placeholder="Email"
                />
                <input
                  type="password"
                  name="password"
                  value={editData.password || project.password || ""}
                  onChange={handleInputChange}
                  placeholder="Password"
                />
                <input
                  type="url"
                  name="websiteURL"
                  value={editData.websiteURL || project.websiteURL || ""}
                  onChange={handleInputChange}
                  placeholder="Website URL"
                />
                <input
                  type="text"
                  name="facebook"
                  value={editData.facebook || project.facebook || ""}
                  onChange={handleInputChange}
                  placeholder="Facebook"
                />
                <input
                  type="text"
                  name="instagram"
                  value={editData.instagram || project.instagram || ""}
                  onChange={handleInputChange}
                  placeholder="Instagram"
                />
                <input
                  type="text"
                  name="twitter"
                  value={editData.twitter || project.twitter || ""}
                  onChange={handleInputChange}
                  placeholder="Twitter"
                />
                <input
                  type="text"
                  name="linkedin"
                  value={editData.linkedin || project.linkedin || ""}
                  onChange={handleInputChange}
                  placeholder="LinkedIn"
                />
                <input
                  type="text"
                  name="location"
                  value={editData.location || project.location || ""}
                  onChange={handleInputChange}
                  placeholder="Location"
                />
                <input
                  type="text"
                  name="phone"
                  value={editData.phone || project.phone || ""}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                />
                <input
                  type="text"
                  name="zipCode"
                  value={editData.zipCode || project.zipCode || ""}
                  onChange={handleInputChange}
                  placeholder="Zip Code"
                />
                <input
                  type="email"
                  name="officeEmail"
                  value={editData.officeEmail || project.officeEmail || ""}
                  onChange={handleInputChange}
                  placeholder="Office Email"
                />
                <textarea
                  name="description"
                  value={editData.description || project.description || ""}
                  onChange={handleInputChange}
                  placeholder="Description"
                />
                <button onClick={() => handleSaveEdit(project.id)}>Save</button>
                <button onClick={() => setEditingProjectId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <h3>{project.title}</h3>
                <p><strong>Website:</strong> {project.website}</p>
                {project.email && <p><strong>Email:</strong> {project.email}</p>}
                {project.websiteURL && <p><strong>Website URL:</strong> {project.websiteURL}</p>}
                {project.facebook && <p><strong>FB:</strong> {project.facebook}</p>}
                {project.instagram && <p><strong>IG:</strong> {project.instagram}</p>}
                {project.twitter && <p><strong>Twitter:</strong> {project.twitter}</p>}
                {project.linkedin && <p><strong>LinkedIn:</strong> {project.linkedin}</p>}
                {project.location && <p><strong>Location:</strong> {project.location}</p>}
                {project.phone && <p><strong>Phone:</strong> {project.phone}</p>}
                {project.zipCode && <p><strong>Zip:</strong> {project.zipCode}</p>}
                {project.officeEmail && <p><strong>Office Email:</strong> {project.officeEmail}</p>}
                <p>{project.description}</p>
                <Link to={`/projects/${project.id}`}>View Backlinks</Link>

                {(role === "admin" || role === "editor") && (
                  <button
                    className="edit-project-btn"
                    onClick={() => {
                      setEditingProjectId(project.id);
                      setEditData(project);
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ProjectList;
