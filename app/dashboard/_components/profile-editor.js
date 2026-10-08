export default function ProfileEditor({ profile, onChange }) {
  return (
    <article className="editor-card" id="profile">
      <h2>Profile setup</h2>
      <p className="github-status" role="status">
        When GitHub is connected, name and bio are filled in when available.
        GitHub profiles do not include a role, so add that manually.
      </p>
      <div className="mock-field">
        <label htmlFor="profile-name">Name</label>
        <input
          id="profile-name"
          name="name"
          value={profile.name}
          onChange={onChange}
          placeholder="e.g. Filip Frontend"
        />
      </div>
      <div className="mock-field">
        <label htmlFor="profile-role">Role</label>
        <textarea
          id="profile-role"
          name="role"
          value={profile.role}
          onChange={onChange}
          placeholder="e.g. Frontend Developer and Product Designer"
          rows={2}
        />
      </div>
      <div className="mock-field">
        <label htmlFor="profile-shortBio">Short bio</label>
        <textarea
          id="profile-shortBio"
          name="shortBio"
          value={profile.shortBio}
          onChange={onChange}
          placeholder="Write a short intro for your portfolio"
          rows={4}
        />
      </div>
      <div className="mock-field">
        <label htmlFor="profile-email">Contact email</label>
        <input
          id="profile-email"
          name="email"
          type="email"
          value={profile.email}
          onChange={onChange}
          placeholder="e.g. hello@example.com"
        />
      </div>
    </article>
  );
}
