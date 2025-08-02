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
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]); // ✅ Array of keywords
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

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
        keywords, // ✅ Save keyword array
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isDeleted: false,
      });

      setTitle("");
      setWebsite("");
      setDescription("");
      setKeywordInput("");
      setKeywords([]);
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

        {/* Keywords input */}
        <div className="keyword-input-section">
          <input
            type="text"
            placeholder="Enter keyword"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
          <button type="button" onClick={addKeyword}>
            Add Keyword
          </button>
          
        </div>
        <br></br>
        {/* Show added keywords */}
        <div className="keywords-list">
          {keywords.map((kw, index) => (
            <span key={index} className="keyword-tag">
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)}>
                ✕
              </button>
            </span>
          ))}
        </div>

        <button type="submit">Create Project</button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
    </div>
  );
};

export default ProjectPage;
