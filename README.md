# Ontology Spreadsheet Editor

A Python-based web platform for collaborative editing of OWL ontologies through intuitive spreadsheet interfaces. The Ontology Spreadsheet Editor enables teams to work with complex ontologies using familiar Excel-like spreadsheet views, making ontology curation accessible to domain experts without requiring deep technical knowledge of OWL syntax.

## 🚀 Features

### Core Functionality

- **Spreadsheet-based Ontology Editing**: Edit OWL ontologies using familiar tabular interfaces
- **Real-time Collaboration**: Multiple users can work on the same ontology simultaneously
- **Version Control Integration**: Built-in GitHub integration for tracking changes and managing releases
- **Advanced Search & Discovery**: Powerful search capabilities across all loaded ontologies
- **Validation & Quality Control**: Built-in validation with error highlighting and suggestions
- **Merge Conflict Resolution**: Automatic and manual merge conflict resolution for collaborative editing

### User Interface

- **Interactive Tables**: Powered by Tabulator.js with sorting, filtering, and grouping
- **Autocomplete & Suggestions**: Context-aware autocomplete for ontology terms and relationships
- **Visual Feedback**: Color-coded rows for different curation statuses and validation states
- **Customizable Views**: Filter by curation status, user assignments, and validation results

### Ontology Management

- **Multi-Repository Support**: Manage multiple ontology repositories simultaneously
- **External Ontology Import**: Import terms from external ontologies and vocabularies
- **Hierarchical Views**: Navigate complex ontology structures with expandable hierarchies
- **Relationship Management**: Define and edit object properties, data properties, and annotations
- **Curation Workflow**: Built-in support for ontology curation workflows with status tracking

### Integration & APIs

- **GitHub OAuth Authentication**: Secure authentication using GitHub accounts
- **Flexible Configuration**: YAML-based configuration for easy deployment customization

## 🛠️ Technology Stack

- **Backend**: Python 3.8+ with Flask framework
- **Frontend**: Vue.3 with TypeScript and Bootstrap
- **Database**: SQLAlchemy with SQLite/PostgreSQL support
- **Search**: Whoosh full-text search engine
- **Ontology Processing**: py-horned-owl for OWL parsing and manipulation
- **File Processing**: pandas and openpyxl for Excel file handling
- **Authentication**: GitHub OAuth integration

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16+ and npm (for frontend build)
- GitHub OAuth application (for authentication)
- Git (for repository integration)

## ⚙️ Setup for Your Own Use

### 1. Clone the Repository

```bash
git clone https://github.com/ontology-tools/onto-tron-5000.git
cd onto-tron-5000
```

### 2. Set Up Python Environment

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. GitHub OAuth Setup

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your Ontology Spreadsheet Editor
   - **Homepage URL**: e.g. `http://localhost:5000` (for development)
   - **Authorization callback URL**: `{URL}/github-callback?`
4. Note down the Client ID and Client Secret

### 5. Configuration

Edit  `config.yaml` file in the project root. You can control the following parameters via environment variables

| Key |  Description | Default | Possible values  |
|---|---|---|---|
| `FLASK_ENV`       | Flask envrionment. See their documentation for more details. | `development`                       | |
|`FLASK_SECRET_KEY` | Random key used for session management | random | |
| `OSE_LOG_LEVEL` | Level of verbosity | `warning` | `debug`, `info`, `warning`, `error` |
| `OSE_ENVIRONMENT` | Toggles some estetics  | value of `FLASK_ENV` | `development`, `production`, `testing` |
| `OSE_GITHUB_CLIENT_ID` | Client id of the GitHub OAuth app| | |
| `OSE_GITHUB_CLIENT_SECRET` | Client secret of the GitHub OAuth app | | |
| `OSE_INDEX_PATH` | Path to store the search index at | `ose_index` | |
| `OSE_URL_PREFIX` | URL prefix the app is served under | `/` | |
| `ROBOT` | Path to [`robot`](https://robot.obolibrary.org) | looks for robot in `$PATH` | |


### 6. Repository Configuration

By default, OntoSpreadEd will not load any repositories on startup and lets users load them dynamically. To preload repositories, create a `startup-repositories.yaml` file to define which ontology repositories to load:

```yaml
- your_org1/your_repo1
- your_org1/your_repo2
- your_org2/your_repo1
```

### 7. Database Setup

Initialize the database:

```bash
flask run db upgrade
```

### 8. Build Frontend Assets

```bash
npm run build
```

### 9. Run the Application

For development:

```bash
flask run
```

The application will be available at `http://localhost:5000`.

For production deployment, use a WSGI server like Gunicorn or uwsgi.

### Custom Ontology Repositories

Each ontology repository should contain:

- `.onto-ed/config.yaml`: Repository-specific configuration [Example from BCIO](https://github.com/HumanBehaviourChangeProject/ontologies/blob/master/.onto-ed/config.yaml)
- `.onto-ed/release_script.json`: A description of the ontology setup [Example from BCIO](https://github.com/HumanBehaviourChangeProject/ontologies/blob/master/.onto-ed/release_script.json)
- .xlsx files with ontology data

Example repository configuration:

```yaml
full_name: my_org/my_repository # Full name of the repository
id_digits: 6 # Number of digits to be used when generating IDs
indexed_files: # List of files or regex expressions of files that should be included in the search index
  - path/to/file1.xlsx # The exact file at /path/to/file
  - sheets/.*.xlsx # All files under sheets
readonly_files: # Mapping of files and explanation to files which should be readonly
    "path/to/file.xlsx": This file is generated automatically from other_file.xlsx
main_branch: main # Name of the main branch of the repository
prefixes: # Prefix mapping of used prefixes in the ontology
    BFO: http://purl.obolibrary.org/obo/BFO_
    IAO: http://purl.obolibrary.org/obo/IAO_
release_file: ontology.owl # Path to the released ontology
release_script_path: .onto-ed/release_script.json # Path to release configuration
short_name: MRO # Short alias to show in the UI
validation: # List of flags for validation
    - include-external # Load the externally imported files for validation
    - include-dependencies # Load dependencies for validation

```

A release script controls the setup of the spreadsheet and should be placed in the repository under `.onto-ed/release_script.json`. It can be edited from the UI. See [the Python class](ose/model/ReleaseScript.py) for details.


## 🔧 Advanced Configuration

### Production Deployment

For production deployment, consider:

- **Set up HTTPS** for secure authentication
- **Configure a reverse proxy** (nginx/Apache) for static file serving
- **Set up monitoring** and logging solutions


#### Example uswgi.ini

```ini
[uwsgi]
virtualenv = venv
module = app:app
socket = /data/ose/uwsgi.sock
harakiri = 120

master = true
processes = 8
vacuum = true
die-on-term = true

req-logger = file:/var/log/ose.req.log
logger = file:/var/log/ose.log
```

#### Example systemd service files

```ini
[Unit]
Description=uWSGI instance to serve ontology spreadsheet editor
After=network.target


[Service]
User=www-data
Group=www-data
Environment=FLASK_ENV=production
Environment=FLASK_SECRET_KEY=
Environment=OSE_GITHUB_CLIENT_ID=
Environment=OSE_GITHUB_CLIENT_SECRET=
Environment=OSE_INDEX_PATH="/data/ose/index"
Environment=OSE_LOG_LEVEL="warning"
WorkingDirectory=/srv/ose
ExecStartPre=/srv/ose/venv/bin/flask db upgrade
ExecStart=uwsgi --ini uwsg.ini --enable-threads

[Install]
WantedBy=multi-user.target
```

## 📄 License

This project is licensed under LGPL v3.0 - see the [COPYING](COPYING) file for details.

## 🆘 Support

- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

## 🔗 Related Projects

- [py-horned-owl](https://github.com/jannahastings/py-horned-owl): Python OWL processing library
- [robot](https://github.com/ontodev/robot): Command line tool to interact with OWL ontologies
