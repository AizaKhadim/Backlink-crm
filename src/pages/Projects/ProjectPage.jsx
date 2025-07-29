import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./ProjectPage.css";

const ProjectPage = () => {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState(""); // ✅ New field
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !website) {
      setError("Title and website are required.");
      return;
    }

    if (!user) {
      setError("User not logged in.");
      return;
    }

    try {
      await addDoc(collection(db, "projects"), {
        title,
        website,
        description,
        keyword,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isDeleted: false, // ✅ Automatically set isDeleted to false
      });

      setTitle("");
      setWebsite("");
      setDescription("");
      setKeyword("");
      setSuccess("✅ Project created successfully!");
    } catch (err) {
      console.error("Error creating project:", err);
      setError("❌ Failed to create project.");
    }
  };

  return (
    <div className="project-page">
      <h2>Create New Project</h2>

      <form className="project-form" onSubmit={handleCreateProject}>
        <input
          type="text"
          placeholder="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Project Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <textarea
          placeholder="Project Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <input
          type="text"
          placeholder="Keyword (optional)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button type="submit">Create Project</button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
    </div>
  );
};

export default ProjectPage;
