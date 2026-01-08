# HireMind / Job Cloud

HireMind is a modern, responsive job board application designed to connect job seekers with their ideal roles efficiently. It features a sleek user interface and an intelligent resume matching system (Work in Progress) to help users find jobs that fit their skills and experience.

## Features

- **Job Browsing**: Explore a wide range of job listings with filtering options (Job Title, Type, Location, etc.).
- **Company Insights**: View detailed profiles for hiring companies.
- **Resume Matching**: (Beta) Upload your resume to find jobs that match your profile using our matching algorithm.
- **Anonymous Feedback**: Suggest new roles or locations and provide general feedback anonymously.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Modern UI**: Built with a focus on aesthetics and user experience using generic colors and animations.
- **Supabase Integration**: Real-time data fetching and secure storage.

## Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: Vanilla CSS / CSS Modules
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Data
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Data Processing**: Python, Pandas
- **Resume Parsing**: Python-based microservice (Dockerized)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- A Supabase account and project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sairam3824/job-cloud.git
    cd job-cloud
    ```

2.  **Frontend Setup:**
    Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
    Install dependencies:
    ```bash
    npm install
    ```
    Create a `.env.local` file in the `frontend` directory with your Supabase credentials and Resume Matcher URL:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_RESUME_PARSER_URL=your_aws_or_localhost_url
    ```
    Run the development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

3.  **Backend / Data Setup:**
    (Optional - for data population or resume matcher)
    
    Install Python dependencies from the root directory:
    ```bash
    pip install -r requirements.txt
    ```
    
    To populate jobs into Supabase (ensure you have `.env` with Supabase Service Role key if needed, or use the anon key depending on script config):
    ```bash
    python run_jobs_supabase.py
    ```

    **Configuration:**
    The job scraper can be configured using `scraper_config.json`. You can modify the list of cities and roles to scrape:
    ```json
    {
      "cities": { ... },
      "roles": [ ... ]
    }
    ```

    **Resume Matcher Service:**
    The resume matching service is containerized and currently deployed on AWS.

    For local development, you can run it using Docker:
    ```bash
    cd resume-matcher
    docker build -t resume-matcher .
    docker run -p 8000:8000 resume-matcher
    ```

## Deployment

### Frontend
The frontend is designed to be deployed on [Vercel](https://vercel.com/):
1.  Push your code to a Git repository.
2.  Import the project into Vercel.
3.  Set the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.).
4.  Deploy.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the Apache License 2.0. See `LICENSE` for more information.
