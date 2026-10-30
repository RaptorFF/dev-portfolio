export const emptyProfile = {
  name: "",
  role: "",
  email: "",
  shortBio: "",
  photo: "",
  address: "",
  phone: "",
  drivingLicense: "",
  hasDrivingLicense: false,
  linkedin: "",
};

export const emptyCv = {
  template: "modern",
  experience: [],
  education: [],
  skills: [],
  interests: [],
  languages: [],
  references: [],
};

export const CV_DRAFT_KEY = "portfolio-forge-cv-draft-v1";
export const MAX_CV_PHOTO_SIZE = 5 * 1024 * 1024;

export const templates = [
  {
    id: "modern",
    label: "Blue & Gray",
    description: "A confident two-column layout with a slate gray sidebar.",
  },
  {
    id: "classic",
    label: "Clean Professional",
    description: "A balanced, traditional layout with refined blue accents.",
  },
  {
    id: "minimal",
    label: "Slate & Gray",
    description: "A two-column layout with a slate header and dark gray sidebar.",
  },
];

export function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasAnyText(...values) {
  return values.some(hasText);
}

export function resizeCvPhoto(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      try {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not process the selected photo.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not process the selected photo."));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () =>
              reject(
                reader.error || new Error("Could not read the selected photo."),
              );
            reader.readAsDataURL(blob);
          },
          "image/webp",
          0.82,
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file is not a valid image."));
    };
    image.src = objectUrl;
  });
}

export function normalizeSkills(skills) {
  return skills
    .map((skill) =>
      typeof skill === "string"
        ? { name: skill, level: 3 }
        : {
            name: typeof skill?.name === "string" ? skill.name : "",
            level: Math.min(5, Math.max(1, Number(skill?.level) || 3)),
          },
    )
    .filter((skill) => skill.name);
}
