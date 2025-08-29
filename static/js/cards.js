let setsMap = {};
fetch("/static/sets.csv")
  .then((res) => res.text())
  .then((csv) => {
    const lines = csv.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length > 1) {
        setsMap[cols[0]] = cols[1];
      }
    }
  });

async function createCard(upload, author) {
  const col = document.createElement("div");
  col.className = "col-lg-3 col-md-4 col-sm-6 col-12 mb-3";

  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  img.src = `/static/uploads/${upload.image}`;
  img.alt = "setname";
  img.className = "card-img-top";
  img.style.height = "130px";
  img.style.objectFit = "cover";

  const cardBody = document.createElement("div");
  cardBody.className = "card-body p-2";

  const title = document.createElement("h5");
  title.className = "card-title mb-1";
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
  By @${upload.author}
`;

    link.appendChild(info);
  }

  cardBody.appendChild(title);
  if (author) {
    cardBody.appendChild(link);
  }
  card.appendChild(img);
  card.appendChild(cardBody);
  col.appendChild(card);

  return col;
}
