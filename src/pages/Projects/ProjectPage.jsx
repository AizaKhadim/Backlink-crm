import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./ProjectPage.css";

const ProjectPage = ({ existingProject = null }) => {
  const { user } = useUser();

  // 🔹 Form state (all fields)
  const [formData, setFormData] = useState({
    title: existingProject?.title || "",
    website: existingProject?.website || "",
    email: existingProject?.email || "",
    password: existingProject?.password || "",
    websiteURL: existingProject?.websiteURL || "",
    facebook: existingProject?.facebook || "",
    instagram: existingProject?.instagram || "",
    twitter: existingProject?.twitter || "",
    linkedin: existingProject?.linkedin || "",
    location: existingProject?.location || "",
    phone: existingProject?.phone || "",
    zipCode: existingProject?.zipCode || "",
    officeEmail: existingProject?.officeEmail || "",
    description: existingProject?.description || "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // 🔹 Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Create new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.website || !formData.description) {
      setError("Title, Website, and Description are required.");
      return;
    }

    if (!user) {
      setError("User not logged in.");
      return;
    }

    try {
      await addDoc(collection(db, "projects"), {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setFormData({
        title: "",
        website: "",
        email: "",
        password: "",
        websiteURL: "",
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        location: "",
        phone: "",
        zipCode: "",
        officeEmail: "",
        description: "",
      });
      setSuccess("✅ Project created successfully!");
    } catch (err) {
      console.error("Error creating project:", err);
      setError("❌ Failed to create project.");
    }
  };

  return (
    <div className="project-page">
      <h2>{existingProject ? "Edit Project" : "Create New Project"}</h2>

      <form className="project-form" onSubmit={handleCreateProject}>
        <input
          type="text"
          name="title"
          placeholder="Project Title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="website"
          placeholder="Project Website"
          value={formData.website}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
        />
        <input
          type="url"
          name="websiteURL"
          placeholder="Website URL"
          value={formData.websiteURL}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="facebook"
          placeholder="Facebook"
          value={formData.facebook}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="instagram"
          placeholder="Instagram"
          value={formData.instagram}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="twitter"
          placeholder="Twitter"
          value={formData.twitter}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="linkedin"
          placeholder="LinkedIn"
          value={formData.linkedin}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="zipCode"
          placeholder="Zip Code"
          value={formData.zipCode}
          onChange={handleInputChange}
        />
        <input
          type="email"
          name="officeEmail"
          placeholder="Office Email"
          value={formData.officeEmail}
          onChange={handleInputChange}
        />
        <textarea
          name="description"
          placeholder="Project Description"
          value={formData.description}
          onChange={handleInputChange}
        ></textarea>

        <button type="submit">{existingProject ? "Save Changes" : "Create Project"}</button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
    </div>
  );
};

export default ProjectPage;
