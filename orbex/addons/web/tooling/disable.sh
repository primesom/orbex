#!/bin/bash
community=$(cd -- "$(dirname "$0")" &> /dev/null && cd ../../.. && pwd)

disableInDir () {
    cd "$1" || exit
    git config --unset core.hooksPath
    rm .eslintignore
    rm .eslintrc.json
    rm jsconfig.json
    rm package.json
    rm package-lock.json
    rm -r node_modules

    # to support old versions
    rm -f .prettierignore
    rm -r .prettierrc.json

    cd - &> /dev/null
}

read -p "Do you want to delete the tooling installed in orbex too ? [y, n]" willingToDeleteToolingInOrbex
if [[ $willingToDeleteToolingInOrbex != "n" ]]
then
    read -p "What is the relative path from community to orbex ? (../orbex)" pathToOrbex
    pathToOrbex=${pathToOrbex:-../orbex}
    pathToOrbex=$(realpath "$community/$pathToOrbex")
fi

disableInDir "$community"

if [[ $willingToDeleteToolingInOrbex != "n" ]]
then
    disableInDir "$pathToOrbex"
fi


echo ""
echo "JS tooling have been removed from the roots"
echo ""
