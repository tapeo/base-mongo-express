envs=($(grep -v '^#' .env | xargs))

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
    echo "No active gcloud account found. Please authenticate using 'gcloud auth login'."
    exit 1
fi

project_id=$(gcloud config get-value project)
if [ -z "$project_id" ]; then
    echo "No project set. Please set a project using 'gcloud config set project PROJECT_ID'."
    exit 1
fi

echo "Current project ID: $project_id"

for env in "${envs[@]}"
do
    key=$(echo $env | cut -d'=' -f1)
    value=$(echo $env | cut -d'=' -f2)

    echo "Processing secret: $key"

    if ! gcloud secrets describe $key &>/dev/null; then
        echo "Creating secret: $key"
        gcloud secrets create $key --replication-policy="automatic"
    else
        echo "Secret $key already exists"
    fi

    echo "Adding new version for secret: $key"
    echo $value | gcloud secrets versions add $key --data-file=-

    echo "Wait 2 seconds for the secret to be created..."
    sleep 2
done

echo "All secrets processed."