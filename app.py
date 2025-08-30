from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory
from database import getDb, closeDb, initDb
import json, os, time
from werkzeug.utils import secure_filename 

# Init App
app = Flask(__name__)
app.secret_key = "TEST"
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Register teardown to close DB on server close
app.teardown_appcontext(closeDb)

# Register Context Processor
@app.context_processor
def injectUser():
    return {'loggedIn': 'userID' in session}

# 404
@app.errorhandler(404)
def pageNotFound(e):
    return render_template('404.html'), 404

# Index Route
@app.route('/')
def index():
    return render_template('index.html')

# Index Route
@app.route('/browse')
def browse():
    return render_template('browse.html')

# Profile Route
@app.route('/profile')
def profile():
    if "userID" in session:
        return render_template('profile.html')
    return redirect(url_for('loginUsername'))

@app.route('/profile/<userid>')
def profileOther(userid):
    return render_template('otherProfile.html')

@app.route('/sets')
def sets():
    return render_template('sets.html')

@app.route('/sets/<setid>')
def setsView(setid):
    return render_template('setsView.html')

# Add Set Route
@app.route('/addset', methods=["GET", "POST"])
def addset():
    if not "userID" in session:
        return redirect(url_for("home"))
    
    if request.method == "POST":
        set_num = request.form.get('set_num')
        file = request.files.get('image')

        if not set_num:
            flash("No set selected.", "error")
            return redirect(url_for('addset'))
        
        if not file or not file.filename:
            flash("Image file is required.", "error")
            return redirect(url_for('addset'))
        
        filename = secure_filename(f"{session['userID']}_{str(int(time.time()))}_{file.filename}")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        db = getDb()
        db.execute("INSERT INTO uploads (author, setid, image) VALUES (?, ?, ?)", (session['userID'], set_num, filename))
        db.commit()

        flash("Set added successfully!", "success")
        return redirect(url_for('home'))
    else:

        return render_template('addset.html')
    
@app.route('/uploads/<filename>')
def uploadedFile(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Register Username
@app.route('/register/username', methods=["GET", "POST"])
def registerUsername():
    if "userID" in session:
        return redirect(url_for('home'))
    
    if request.method == "POST":
        username = request.json.get("username")
        avatar = str(request.json.get("avatar"))
        if not username:
            return jsonify({"error": "No username provided."}), 400
        
        if not avatar:
            return jsonify({"error": "No avatar provided."}), 400
        
        db = getDb()
        existingUser = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if existingUser:
            return jsonify({"error": "Username already taken."}), 409
        else:
            session["registerUsername"] = username
            session["registerAvatar"] = avatar
            return jsonify({"success": True, "username": username, "avatar": avatar})
    else:
        return render_template('auth/register/username.html')
    
# Register Password
@app.route('/register/password', methods=["GET", "POST"])
def registerPassword():
    if "userID" in session:
        return redirect(url_for('home'))
    if request.method == "POST":
        password = request.json.get('password')
        if not password:
            return jsonify({"error": "No password provided."}), 400
        
        username = session["registerUsername"]
        if not username:
            return jsonify({"error": "No username has been set."}), 400
        
        avatar = session["registerAvatar"]
        if not avatar:
            return jsonify({"error": "No avatar has been set."}), 400
        
        db = getDb()
        try:
            db.execute("INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)", (username, password, str(avatar)))
            db.commit()

            user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
            session["userID"] = user["id"]
            session["username"] = user["username"]
            session["avatar"] = user["avatar"]

            return jsonify({"success": True}), 200
        except Exception as e:
           session.clear()
           return jsonify({"error": "Username already taken."}), 409
    else:
        if session["registerUsername"]:
            return render_template('auth/register/password.html')
        else:
            return redirect(url_for('registerUsername'))
        
# Login Username
@app.route('/login/username', methods=["GET", "POST"])
def loginUsername():
    if "userID" in session:
        return redirect(url_for('home'))
    if request.method == "POST":
        username = request.json.get("username")
        if not username:
            return jsonify({"error": "No username provided."}), 400
        
        session["loginUsername"] = username
        return jsonify({"success": True, "username": username})
    else:
        return render_template('auth/login/username.html')
    
# Login Password
@app.route('/login/password', methods=["GET", "POST"])
def loginPassword():
    if "userID" in session:
        return redirect(url_for('home'))
    if request.method == "POST":
        password = request.json.get('password')
        if not password:
            return jsonify({"error": "No password provided."}), 400
        
        username = session["loginUsername"]
        
        if not username:
            return jsonify({"error": "No username has been set."}), 400
        
        db = getDb()
        try:
            user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
            if user and user["password"] == password:
                session["userID"] = user["id"]
                session["username"] = user["username"]
                return jsonify({"success": True}), 200
            if not user:
                return jsonify({"error": "User doesn't exist."}), 400
            
            return jsonify({"error": "Incorrect password."}), 400
        
        except Exception as e:
           return jsonify({"error": "Username already taken."}), 409
    else:
        if session["loginUsername"]:
            return render_template('auth/login/password.html')
        else:
            return redirect(url_for('loginUsername'))

# API ROUTES
# Get Recent Set Uploads
@app.route('/api/uploads')
def getUploads():
    db = getDb()

    # API Query Parameters
    limit = request.args.get('limit', default=20, type=int)
    sort = request.args.get('sort', default='newest', type=str)
    page = request.args.get('page', default=1, type=int)
    perPage = request.args.get('per_page', default=20, type=int)
    author = request.args.get('author', default=None, type=int)
    setid = request.args.get('set', default=None, type=str)

    # Validate Parameters
    if limit < 1:
        limit = 20
    if page < 1:
        page = 1
    if perPage < 1:
        perPage = 20
    if sort not in ['newest', 'oldest', 'random']:
        sort = 'newest'

    # Where Clause
    conditions = []
    params = []
    if author is not None:
        conditions.append("author = ?")
        params.append(author)
    if setid is not None:
        conditions.append("setid = ?")
        params.append(setid)
    whereClause = " WHERE " + " AND ".join(conditions) if conditions else ""

    # Total count query
    totalQuery = f"SELECT COUNT(*) FROM uploads{whereClause}"
    total = db.execute(totalQuery, params).fetchone()[0]

    # Build Query
    query = f"SELECT * FROM uploads{whereClause}"

    if sort == 'random':
        query += " ORDER BY RANDOM()"
        query += " LIMIT ?"
        params.append(limit)
    else:
        if sort == 'oldest':
            query += " ORDER BY created_at ASC"
        else:
            query += " ORDER BY created_at DESC"
    
        # Pagination
        offset = (page - 1) * perPage
        query += " LIMIT ? OFFSET ?"
        params.extend([perPage, offset])

    # Complete Query
    uploads = db.execute(query, params).fetchall()
    result = [dict(row) for row in uploads]
    return jsonify({
        "success": True,
        "uploads": result,
        "total": total,
        "page": page if sort != 'random' else None,
        "per_page": perPage if sort != 'random' else None,
        "limit": limit,
        "sort": sort,
        "author": author
    }), 200

@app.route('/api/user')
def getUser():
    db = getDb()

    # API Query Parameters
    rawID = request.args.get('id', default=None)
    userID = None
    username = request.args.get('username', default=None, type=str)

    # Validate Parameters
    if rawID is not None:
        try:
            userID = int(rawID)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid id parameter: Must be an integer"}), 400
        
    # No parameters, return current logged-in user
    if userID is None and not username:
        if "userID" not in session:
            return jsonify({"error": "User not found."}), 401
        user = db.execute("SELECT id, username, avatar FROM users WHERE id = ?", (session["userID"],)).fetchone()
        if not user:
            session.clear()
            return jsonify({"error": "User not found."}), 404
        return jsonify({"success": True, "user": dict(user)}), 200
    
    # Search by ID
    if userID is not None:
        user = db.execute("SELECT id, username, avatar FROM users WHERE id = ?", (userID,)).fetchone()
        if not user:
            return jsonify({"error": "User not found."}), 404
        return jsonify({"success": True, "user": dict(user)}), 200
    
    # Search by Username
    if username:
        user = db.execute("SELECT id, username, avatar FROM users WHERE username = ?", (username,)).fetchone()
        if not user:
            return jsonify({"error": "User not found."}), 404
        return jsonify({"success": True, "user": dict(user)}), 200
    
@app.route('/api/sets')
def getSets():
    db = getDb()

    # API Query Parameters
    limit = request.args.get('limit', default=10, type=int)

    # Validate Parameters
    if limit < 1:
        limit = 10
    
    # Query
    query = "SELECT setid, COUNT(*) as upload_count FROM uploads GROUP BY setid ORDER BY upload_count DESC LIMIT ?"
    sets = db.execute(query, (limit,)).fetchall()
    result = [dict(row) for row in sets]

    return jsonify({
        "success": True,
        "sets": result,
        "limit": limit
    }), 200
    



@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))
        

if __name__ == '__main__':
    initDb(app)
    app.run(debug=True, host='0.0.0.0')
