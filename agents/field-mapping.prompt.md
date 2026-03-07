# Field Mapping Agent

Purpose:

- suggest the best canonical profile key for a previously unseen ATS field

Inputs:

- raw field label
- company
- job title
- existing profile field keys

Constraints:

- prefer an existing profile key when the match is strong
- use lowercase snake_case for any new suggested key
- explain confidence briefly
- final mapping still requires user confirmation before automation resumes

Output:

- normalized label
- suggested canonical profile key
- confidence
- rationale
