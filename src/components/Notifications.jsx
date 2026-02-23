import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import { db } from "../firebase";
import './Notifications.css';

const NotificationsPage = () => {
  const { role } = useUser();
  const navigate = useNavigate();
  const [deleteRequests, setDeleteRequests] = useState([]);

  // Fetch pending delete requests
  useEffect(() => {
    if (!role || role.toLowerCase() !== "admin") return;

    const q = query(
      collection(db, "delete_requests"),
      where("status", "==", "Pending_Admin")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
  const list = await Promise.all(snapshot.docs.map(async docSnap => {
    const reqData = { id: docSnap.id, ...docSnap.data() };

    // If backlink, fetch full backlink data safely
    if(reqData.type === "backlink") {
      try {
        const category = reqData.category || "Uncategorized"; // ✅ fallback
        const backlinkRef = doc(db, "projects", reqData.projectId, category, reqData.itemId);
        const backlinkSnap = await getDoc(backlinkRef);
        if(backlinkSnap.exists()) {
          reqData.fullData = backlinkSnap.data();
        } else {
          reqData.fullData = reqData.backlinkData || {}; // fallback agar doc missing
        }
      } catch (e) {
        console.error("Error fetching backlink data:", e);
        reqData.fullData = reqData.backlinkData || {}; // fallback
      }
    }

    // Projects: optionally fetch more info if needed (e.g., description)
    if(reqData.type === "project") {
      try {
        const projectRef = doc(db, "projects", reqData.itemId);
        const projectSnap = await getDoc(projectRef);
        if(projectSnap.exists()) {
          reqData.projectData = projectSnap.data();
        }
      } catch (e) {
        console.error("Error fetching project data:", e);
      }
    }

    return reqData;
  }));

  setDeleteRequests(list);
});

    return () => unsubscribe();
  }, [role]);

  // Approve request
  const handleApprove = async (req) => {
  try {
    if (!req || !req.type || !req.id) {
      alert("❌ Invalid request data!");
      return;
    }

    // 🔹 BACKLINK
    if (req.type === "backlink") {
      const projectId = req.projectId || req.backlinkData?.projectId;
      const category = req.category || req.backlinkData?.category || "Uncategorized";

      if (!projectId) {
        alert("❌ Project ID missing for this backlink!");
        return;
      }

      const linkData = req.fullData || req.backlinkData;
      if (!linkData) {
        alert("❌ No backlink data available!");
        return;
      }

      // Copy to trash
      await setDoc(doc(db, "backlinks_trash", req.itemId), {
        ...linkData,
        projectId,
        category,
        deletedAt: serverTimestamp(),
      });

      // Delete original
      await deleteDoc(doc(db, "projects", projectId, category, req.itemId));
    }

    // 🔹 PROJECT
    if (req.type === "project") {
      const projectId = req.itemId;
      const projectData = req.projectData;

      if (!projectId || !projectData) {
        alert("❌ Project data missing!");
        return;
      }

      // Copy to project trash
      await setDoc(doc(db, "projects_trash", projectId), {
        ...projectData,
        deletedAt: serverTimestamp(),
      });

      // Delete original project
      await deleteDoc(doc(db, "projects", projectId));
    }

    // 🔹 Delete the request itself
    await deleteDoc(doc(db, "delete_requests", req.id));

    alert("✅ Approved successfully!");
  } catch (error) {
    console.error("Approve error:", error);
    alert("❌ Error approving request: " + (error.message || error));
  }
};
  // Reject request
  const handleReject = async (req) => {
    try {
      await deleteDoc(doc(db, "delete_requests", req.id));
      alert("Request rejected!");
    } catch (error) {
      console.error(error);
      alert("Error rejecting request");
    }
  };

  return (
    <div className="notifications-page">
      <h2>Delete Requests</h2>
      {deleteRequests.length === 0 ? (
        <p className="empty-text">No pending requests</p>
      ) : (
        deleteRequests.map(req => (
          req.type === "backlink" && req.fullData ? (
            <table key={req.id} className="notifications-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Website</th>
                  <th>DA</th>
                  <th>Spam Score</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Link</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{req.projectTitle}</td>
                  <td>{req.category}</td>
                  <td>{req.fullData.website}</td>
                  <td>{req.fullData.da}</td>
                  <td>{req.fullData.spamScore}</td>
                  <td>{req.fullData.username}</td>
                  <td>{req.fullData.password}</td>
                  <td>{req.fullData.link}</td>
                  <td>{req.fullData.notes}</td>
                  <td>
                    <button className="approve-btn" onClick={() => handleApprove(req)}>Approve</button>
                    <button className="reject-btn" onClick={() => handleReject(req)}>Reject</button>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : req.type === "project" && req.projectData ? (
            <div key={req.id} className="delete-request-card">
              <p>
                <strong>{req.requestedBy}</strong> requested to delete project <strong>{req.projectTitle}</strong>
              </p>
              <p>Description: {req.projectData.description || "N/A"}</p>
              <div className="request-actions">
                <button className="approve-btn" onClick={() => handleApprove(req)}>Approve</button>
                <button className="reject-btn" onClick={() => handleReject(req)}>Reject</button>
              </div>
            </div>
          ) : null
        ))
      )}
    </div>
  );
};

export default NotificationsPage;