// src/pages/Projects/ProjectDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./ProjectDetails.css";

const backlinkCategories = [
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks",
];

const ProjectDetails = () => {
  const { id } = useParams();
  const { role } = useUser();
  const [project, setProject] = useState(null);
  const [backlinksByCategory, setBacklinksByCategory] = useState({});
  const [formData, setFormData] = useState({
    date: "",
    website: "",
    da: "",
    spamScore: "",
    username: "",
    password: "",
    link: "",
    category: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProjectAndBacklinks = async () => {
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject(docSnap.data());
        }

        const newBacklinksByCategory = {};
        for (const cat of backlinkCategories) {
          const snapshot = await getDocs(collection(db, "projects", id, cat));
          newBacklinksByCategory[cat] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }

        setBacklinksByCategory(newBacklinksByCategory);
        setLoading(false);
      } catch (err) {
        console.error("Error loading project details:", err);
        setLoading(false);
      }
    };

    fetchProjectAndBacklinks();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddBacklink = async () => {
    const {
      date,
      website,
      da,
      spamScore,
      username,
      password,
      link,
      category,
      notes,
    } = formData;

    if (!date || !website || !da || !spamScore || !username || !password || !link || !category) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "projects", id, category), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      setFormData({
        date: "",
        website: "",
        da: "",
        spamScore: "",
        username: "",
        password: "",
        link: "",
        category: "",
        notes: "",
      });
      setSuccess("✅ Backlink added!");
    } catch (err) {
      console.error("Error adding backlink:", err);
    }
  };

  if (loading) return <p>Loading project...</p>;

  return (
    <div className="project-details-page">
      <h2>{project?.title}</h2>
      <p>{project?.description}</p>

      <h3>Backlink Categories</h3>

      {Object.entries(backlinksByCategory).map(([category, links]) => (
        <div key={category} className="category-block">
          <h4>{category}</h4>
          {links.length === 0 ? (
            <p>No backlinks yet in this category.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Website</th>
                  <th>DA</th>
                  <th>Spam Score</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Link</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td>{link.date}</td>
                    <td>{link.website}</td>
                    <td>{link.da}</td>
                    <td>{link.spamScore}</td>
                    <td>{link.username}</td>
                    <td>{link.password}</td>
                    <td>
                      <a href={link.link} target="_blank" rel="noreferrer">
                        {link.link}
                      </a>
                    </td>
                    <td>{link.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {role !== "viewer" && (
        <>
          <h3>Add New Backlink</h3>
          <div className="backlink-form">
            <input name="date" type="date" value={formData.date} onChange={handleInputChange} placeholder="Date" />
            <input name="website" value={formData.website} onChange={handleInputChange} placeholder="Website" />
            <input name="da" value={formData.da} onChange={handleInputChange} placeholder="DA (e.g., 40)" />
            <input name="spamScore" value={formData.spamScore} onChange={handleInputChange} placeholder="Spam Score" />
            <input name="username" value={formData.username} onChange={handleInputChange} placeholder="Username" />
            <input name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" />
            <input name="link" value={formData.link} onChange={handleInputChange} placeholder="Backlink URL" />
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Notes" />
            <select name="category" value={formData.category} onChange={handleInputChange}>
              <option value="">Select Category</option>
              {backlinkCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button onClick={handleAddBacklink}>Add Backlink</button>
            {success && <p className="success-text">{success}</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDetails;
