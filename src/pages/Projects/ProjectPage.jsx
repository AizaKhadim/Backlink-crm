import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./ProjectPage.css";

const ProjectPage = () => {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleCreateProject = async (e) => {
    e.preventDefault(); // prevent page refresh
    setError("");
    setSuccess("");

    if (!title || !description) {
      setError("Title and description are required.");
      return;
    }

    if (!user) {
      setError("User not logged in.");
      return;
    }

    try {
      await addDoc(collection(db, "projects"), {
        title,
        description,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setTitle("");
      setDescription("");
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
        <textarea
          placeholder="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        <button type="submit">Create Project</button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
    </div>
  );
};

export default ProjectPage;
