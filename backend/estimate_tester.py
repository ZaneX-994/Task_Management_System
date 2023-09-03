from routers.tasks import Estimator
import os
vicuna = "vicuna-7b-v1.3.ggmlv3.q2_K.bin"
vic_url = "https://huggingface.co/localmodels/Vicuna-7B-v1.3-ggml/resolve/main/vicuna-7b-v1.3.ggmlv3.q2_K.bin"
wizard = "wizardLM-7B.ggmlv3.q4_0.bin"
wiz_url = "https://huggingface.co/TheBloke/wizardLM-7B-GGML/resolve/main/wizardLM-7B.ggmlv3.q4_0.bin"
wizuncen = "WizardLM-7B-uncensored.ggmlv3.q2_K.bin"
wizuncen_url = "https://huggingface.co/TheBloke/WizardLM-7B-uncensored-GGML/resolve/main/WizardLM-7B-uncensored.ggmlv3.q2_K.bin"

choice = (wizard, wiz_url)
# choice = (vicuna, vic_url)
# choice = (wizuncen, wizuncen_url)


oracle = Estimator(os.path.join(os.getcwd(), "models", choice[0]), choice[1])

titles_descriptions = [
    {"title": "Send a weekly status report", "desc": "Compile and send a weekly status report to the project manager detailing completed tasks, upcoming tasks, and any blockers"},
    {"title": "Organize the meeting notes", "desc": "Compile and organize the notes taken during the team meeting into a coherent summary and distribute to the team"},
    {"title": "Bug fix: login issue", "desc": "Debug and fix the issue preventing users from logging into the system. Issue reported by user is 'Invalid Password' error even with correct password"},
    {"title": "Create PowerPoint for the project presentation", "desc": "Create a PowerPoint presentation for the next week's project meeting. Include project updates, achievements, challenges and next steps"},
    {"title": "Update project documentation", "desc": "Update the project documentation to reflect the recent changes made to the software application. Changes include addition of new features and removal of deprecated functionalities"},
    {"title": "Schedule team building activity", "desc": "Plan and schedule a team building activity for the next month. The activity should be fun, engaging and suitable for a remote team"},
    {"title": "Set up a meeting with the client", "desc": "Schedule a meeting with the client to discuss their feedback on the latest software release. Ensure all key team members are available to attend"},
    {"title": "Perform code review for a colleague", "desc": "Perform a code review on the recent changes pushed by a colleague to the version control system. Check for coding standards, performance, and potential bugs"},
    {"title": "Update user manual", "desc": "Update the user manual to reflect the new features added in the latest release of the software application. The user manual should be simple and easy to understand for end users"},
    {"title": "Reconcile expenses for the project", "desc": "Review and reconcile all the expenses incurred for the project for this quarter. Categorize the expenses and prepare a report for the project manager"},
]


test_regex = [
    ("""
    Mean: 10 Minutes
    Standard Deviation: 5 Minutes
    """, (10, 5)),
    ("""
    Mean: 1 hour and 45 minutes
Standard Deviation: 1 hour and 20 minutes
To complete this task, it will take approximately 1 hour and 45 minutes. However, the task may vary in time based on the complexity of the project and the individual's skill level. The task should be completed within the given timeframe of 5 hours, with no more than 5 hours spent on the task.
    """, (105, 80)),
    ("""
    Mean: 1.5 hours
Standard Deviation: 0.75 hours"
    """, (90, 45)),
    ("Mean: 2 hours\nStandard Deviation: 1 hour\nEstimates:\n- Mean: 2 hours (± 1 hour)\n- Standard Deviation: 1 hour (± 1 hour)", (120, 60)), 
    ("Mean: 90 minutes\nStandard Deviation: 45 minutes", (90, 45)),
    ("Mean: 2 hours\nStandard Deviation: 1 hour", (120, 60)),
    ("Mean: 2.5 hours\nStandard Deviation: 1 hour", (150, 60)),
    ("""
    ased on the instructions provided, here is an estimate of the mean time to complete the task of compiling and sending a weekly status report: 
        Mean: 3 hours
        Standard Deviation : 1 hour 
This means that the average time it takes to complete this task is three hours, with a standard deviation of one hour. The range of possible times it could take to complete this task is from 0 to 5 hours.

    """, (180, 60))
]


# print(oracle.extract_mean_std("Mean: 10 Minutes\nStandard Deviation: 5 Minutes"))
# print(oracle.extract_mean_std("Mean: 1.5 hours\nStandard Deviation: 0.75 hours"))
# print(oracle.extract_mean_std(""))
# print(oracle.extract_mean_std(""))

results = []
for test in test_regex:
    if (oracle.extract_mean_std(test[0]) != test[1]):
        print(oracle.extract_mean_std(test[0]), test[1])
        print(test[0])
        print("FAILFAIL")
for task in titles_descriptions:
        

    print("-------------------------------------------")
    results.append(oracle.get_task_estimate(task["title"], task["desc"]))
    # print(f"For the task '{task['title']}', the estimated mean time is {result['mean']} minutes and the standard deviation is {result['std_dev']} minutes.")


print(results)
# for r in results:
    # if r == {j}:

# print(int(sum((r == {"mean": 30, "std_dev": 15}) for r in results)))