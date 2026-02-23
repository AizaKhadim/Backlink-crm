import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./ProjectInfo.css";

const ProjectInfo = () => {
  const { id } = useParams();
  const { role } = useUser();

  const [project, setProject] = useState(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectFormData, setProjectFormData] = useState({});

  useEffect(() => {
    const fetchProject = async () => {
      const docRef = doc(db, "projects", id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setProject({ id: snapshot.id, ...snapshot.data() });
      }
    };
    fetchProject();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProject = async () => {
    const docRef = doc(db, "projects", id);
    await updateDoc(docRef, projectFormData);

    setProject((prev) => ({
      ...prev,
      ...projectFormData,
    }));

    setIsEditingProject(false);
  };

  const startEditingProject = () => {
    setProjectFormData({
      title: project.title || "",
      website: project.website || "",
      websiteURL: project.websiteURL || "",
      description: project.description || "",
      email: project.email || "",
      officeEmail: project.officeEmail || "",
      phone: project.phone || "",
      location: project.location || "",
      zipCode: project.zipCode || "",
      facebook: project.facebook || "",
      instagram: project.instagram || "",
      twitter: project.twitter || "",
      linkedin: project.linkedin || "",
    });

    setIsEditingProject(true);
  };

  if (!project) return <p>Loading...</p>;

  return (
    <div className="project-info-wrapper">
      <h2 className="project-info-heading">Project Information</h2>

      {isEditingProject ? (
        <div className="project-edit-form-container">

          {/* ===== Basic Info ===== */}
          <h4 className="project-form-section-title">Basic Information</h4>

          <label className="project-form-label">Project Title</label>
          <input
            className="project-form-input"
            name="title"
            placeholder="Enter project title"
            value={projectFormData.title}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Website Name</label>
          <input
            className="project-form-input"
            name="website"
            placeholder="Enter website name"
            value={projectFormData.website}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Website URL</label>
          <input
            className="project-form-input"
            name="websiteURL"
            placeholder="https://example.com"
            value={projectFormData.websiteURL}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Description</label>
          <textarea
            className="project-form-textarea"
            name="description"
            placeholder="Write short description about the project..."
            value={projectFormData.description}
            onChange={handleInputChange}
          />

          {/* ===== Contact Info ===== */}
          <h4 className="project-form-section-title">Contact Information</h4>

          <label className="project-form-label">Primary Email</label>
          <input
            className="project-form-input"
            name="email"
            placeholder="example@gmail.com"
            value={projectFormData.email}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Company Email</label>
          <input
            className="project-form-input"
            name="officeEmail"
            placeholder="office@example.com"
            value={projectFormData.officeEmail}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Phone Number</label>
          <input
            className="project-form-input"
            name="phone"
            placeholder="+92 300 1234567"
            value={projectFormData.phone}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Location</label>
          <input
            className="project-form-input"
            name="location"
            placeholder="City, Country"
            value={projectFormData.location}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Zip Code</label>
          <input
            className="project-form-input"
            name="zipCode"
            placeholder="54000"
            value={projectFormData.zipCode}
            onChange={handleInputChange}
          />

          {/* ===== Social Links ===== */}
          <h4 className="project-form-section-title">Social Media Links</h4>

          <label className="project-form-label">Facebook</label>
          <input
            className="project-form-input"
            name="facebook"
            placeholder="https://facebook.com/yourpage"
            value={projectFormData.facebook}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Instagram</label>
          <input
            className="project-form-input"
            name="instagram"
            placeholder="https://instagram.com/yourprofile"
            value={projectFormData.instagram}
            onChange={handleInputChange}
          />

          <label className="project-form-label">Twitter (X)</label>
          <input
            className="project-form-input"
            name="twitter"
            placeholder="https://twitter.com/yourprofile"
            value={projectFormData.twitter}
            onChange={handleInputChange}
          />

          <label className="project-form-label">LinkedIn</label>
          <input
            className="project-form-input"
            name="linkedin"
            placeholder="https://linkedin.com/company/yourcompany"
            value={projectFormData.linkedin}
            onChange={handleInputChange}
          />

          <div className="project-form-button-group">
            <button
              className="project-save-btn"
              onClick={handleSaveProject}
            >
              Save Changes
            </button>

            <button
              className="project-cancel-btn"
              onClick={() => setIsEditingProject(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="project-view-container">
  <h3 className="project-title-display">{project.title || "—"}</h3>

  <p><strong>Website:</strong> {project.website || "—"}</p>
  <p><strong>Assignee Email:</strong> {project.email || "—"}</p>
  <p><strong>Website URL:</strong> {project.websiteURL || "—"}</p>
  <p><strong>Facebook:</strong> {project.facebook || "—"}</p>
  <p><strong>Instagram:</strong> {project.instagram || "—"}</p>
  <p><strong>Twitter:</strong> {project.twitter || "—"}</p>
  <p><strong>LinkedIn:</strong> {project.linkedin || "—"}</p>
  <p><strong>Location:</strong> {project.location || "—"}</p>
  <p><strong>Phone:</strong> {project.phone || "—"}</p>
  <p><strong>Zip Code:</strong> {project.zipCode || "—"}</p>
  <p><strong>Company Email:</strong> {project.officeEmail || "—"}</p>
  <p><strong>Description:</strong> {project.description || "—"}</p>

  {(role === "admin" || role === "editor") && (
    <button
      className="project-edit-btn"
      onClick={startEditingProject}
    >
      ✏️ Edit Project
    </button>
  )}
</div>
      )}
    </div>
  );
};

export default ProjectInfo;
