
function getChildName(){
    return localStorage.getItem("childName") || "لولو";
}

function setChildName(name){
    const cleanName = String(name || "").trim() || "لولو";
    localStorage.setItem("childName", cleanName);
}

function addStar(){
    const stars = getStars() + 1;
    localStorage.setItem("stars", stars);
}




function getStars(){

    return Number(localStorage.getItem("stars") || 0);

}




function addDrawing(image){
    const drawings = getDrawings();
    drawings.push({
        image: image,
        date: new Date().toLocaleDateString("ar")
    });
    localStorage.setItem("drawings", JSON.stringify(drawings));
    addStar();
}





function getDrawings(){


    try {
        return JSON.parse(localStorage.getItem("drawings") || "[]");
    } catch (error) {
        console.warn("Invalid drawings data in localStorage, resetting.", error);
        localStorage.removeItem("drawings");
        return [];
    }


}





function clearDrawings(){
    localStorage.removeItem("drawings");
}

function clearAllData(){
    localStorage.removeItem("drawings");
    localStorage.removeItem("stars");
    localStorage.removeItem("childName");
}

function removeDrawing(index){
    const drawings = getDrawings();
    if (index < 0 || index >= drawings.length) {
        return;
    }
    drawings.splice(index, 1);
    localStorage.setItem(
        "drawings",
        JSON.stringify(drawings)
    );
}
