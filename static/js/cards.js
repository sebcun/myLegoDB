let setsMap = {};
let imagesMap = {};

fetch("/static/sets.csv")
  .then((res) => res.text())
  .then((csv) => {
    const lines = csv.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length > 1) {
        setsMap[cols[0]] = cols[1];
        imagesMap[cols[0]] = cols[5];
      }
    }
  });

async function createCard(upload, author, currentUserId) {
  const col = document.createElement("div");
  col.className = "col-lg-3 col-md-4 col-sm-6 col-12 mb-3";

  const card = document.createElement("div");
  card.className = "card border-0 shadow";

  const cardDate = document.createElement("div");
  cardDate.className = "card-date p-1";
  const createdDate = new Date(upload.created_at);
  const formattedDate = createdDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  cardDate.textContent = `Posted on ${formattedDate}`;

  const img = document.createElement("img");
  img.src = `/static/uploads/${upload.image}`;
  img.alt = "setname";
  img.className = "card-img-top";
  img.style.height = "130px";
  img.style.objectFit = "cover";
  img.style.cursor = "pointer";
  img.setAttribute("data-bs-toggle", "modal");
  img.setAttribute(
    "data-bs-target",
    `#imageModal-${upload.image.replace(/[^a-zA-Z0-9]/g, "")}`
  );

  const cardBody = document.createElement("div");
  cardBody.className = "card-body p-2";

  const title = document.createElement("h5");
  title.className = "card-title mb-1 text-primary";
  title.textContent = setsMap[upload.setid] || upload.setid;

  const link = document.createElement("a");
  link.href = `/profile/${upload.author}`;
  link.className = "text-decoration-none";

  if (author) {
    const info = document.createElement("p");
    info.className =
      "card-text text-muted small d-flex align-items-center mb-0";
    info.innerHTML = `
  <img src="/static/images/avatars/${author.avatar || 0}.png" 
       alt="Avatar" 
       class="avatar rounded-circle me-2" 
       style="width:20px; height:20px;">
  By @${author.display}
`;

    link.appendChild(info);
  }

  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = `imageModal-${upload.image.replace(/[^a-zA-Z0-9]/g, "")}`;
  modal.setAttribute("tabindex", "-1");
  modal.setAttribute("aria-labelledby", "imageModalLabel");
  modal.setAttribute("aria-hidden", "true");

  const modalDialog = document.createElement("div");
  modalDialog.className = "modal-dialog modal-dialog-centered modal-lg";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body p-0";

  const modalImg = document.createElement("img");
  modalImg.src = `/static/uploads/${upload.image}`;
  modalImg.className = "img-fluid w-100";

  const modalFooter = document.createElement("div");
  modalFooter.className =
    "modal-footer d-flex justify-content-between align-items-center";

  const likeBtn = document.createElement("button");
  likeBtn.type = "button";
  likeBtn.className = "btn btn-outline-danger btn-sm";
  likeBtn.innerHTML = `<i class="bi bi-heart-fill"></i>
${upload.like_count}`;
  if (upload.is_liked) {
    likeBtn.classList.add("btn-danger");
    likeBtn.classList.remove("btn-outline-danger");
  }

  if (currentUserId) {
    likeBtn.addEventListener("click", async () => {
      try {
        const response = await fetch(`/api/like/${upload.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.success) {
          upload.like_count = data.like_count;
          upload.is_liked = data.liked;
          likeBtn.innerHTML = `<i class="bi bi-heart-fill"></i>
 ${data.like_count}`;
          if (upload.is_liked) {
            likeBtn.classList.add("btn-danger");
            likeBtn.classList.remove("btn-outline-danger");
          } else {
            likeBtn.classList.remove("btn-danger");
            likeBtn.classList.add("btn-outline-danger");
          }
        }
      } catch (error) {
        console.error("error toggling like:", error);
      }
    });
  } else {
    likeBtn.disabled = true;
    likeBtn.title = "Log in to like";
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn btn-secondary btn-sm";
  closeBtn.setAttribute("data-bs-dismiss", "modal");
  closeBtn.textContent = "Close";

  modalFooter.appendChild(likeBtn);

  modalFooter.appendChild(closeBtn);
  modalBody.appendChild(modalImg);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);
  modalDialog.appendChild(modalContent);
  modal.appendChild(modalDialog);

  card.appendChild(cardDate);
  card.appendChild(img);
  cardBody.appendChild(title);
  if (author) {
    cardBody.appendChild(link);
  }
  card.appendChild(cardBody);
  col.appendChild(card);
  col.appendChild(modal);

  return col;
}
