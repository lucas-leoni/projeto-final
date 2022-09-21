const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

const JWTSecret = "f45777f3-a02d-4523-84e4-ad53deb0965a";

app.set("view engine", "ejs");
app.set("views", "./app/views");

app.use(express.static("./app/public"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const DB = {
  users: [
    {
      id: 1,
      nome: "lucas",
      senha: "lucas123",
    },
    {
      id: 2,
      nome: "alex",
      senha: "alex123",
    },
    {
      id: 3,
      nome: "bia",
      senha: "bia123",
    },
    {
      id: 4,
      nome: "cris",
      senha: "cris123",
    },
  ],
};

function auth(req, res, next) {
  req.headers.authorization = "bearer " + tokenHeader;
  const authToken = req.headers["authorization"];

  if (authToken !== undefined) {
    const bearer = authToken.split(" ");
    console.log("BEARER: ", bearer);

    const token = bearer[1];

    jwt.verify(token, JWTSecret, (err, data) => {
      if (err) {
        res.status(401);
        res.json({ message: "ERR6: Token inválido." });
      } else {
        console.log(data);
        req.token = token;
        req.loggedUser = { id: data.id, nome: data.nome };
        console.log("USER AUTORIZADO!");
        next();
      }
    });
  } else {
    res.status(401);
    res.json({
      message: "ERR7: Ops, essa rota está protegida, não é possível acessá-la.",
    });
  }
}

app.get("/", (req, res) => {
  res.render("index");
});

let tokenHeader = "";
let dados = "";

app.get("/chat", auth, (req, res) => {
  res.render("chat", { dados });
});

app.post("/auth", (req, res) => {
  const dadosForm = req.body;
  dados = dadosForm;
  const nome = dadosForm.nome;
  const senha = dadosForm.senha;
  if (nome !== undefined) {
    const user = DB.users.find((u) => u.nome == nome);
    if (user !== undefined) {
      if (user.senha === senha) {
        jwt.sign(
          {
            id: user.id,
            nome: user.nome,
          },
          JWTSecret,
          {
            expiresIn: "1h",
          },
          (err, token) => {
            if (err) {
              console.log(err);
              res.status(400);
              res.json({
                message: "ERR5: Ops, não foi possível gerar o token.",
              });
            } else {
              res.status(200);
              tokenHeader = token;
              io.emit("msgParaCliente", {
                nome: dadosForm.nome,
                mensagem: "Entrou no chat",
              });
              res.redirect("/chat");
            }
          }
        );
      } else {
        res.status(401);
        res.json({ message: "ERR2: Ops, Username ou Password não coincidem." });
      }
    } else {
      res.status(404);
      res.json({ message: "ERR3: Ops, usuário não existe." });
    }
  } else {
    res.status(400);
    res.json({ message: "ERR1: Username ou Password não podem ser nulos." });
  }
});

const server = app.listen(5000, () => {
  console.log("Servidor rodando na url => http://localhost:5000");
});

const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("User entrou na sala.");

  socket.on("disconnect", () => {
    console.log("User saiu da sala.");
  });

  socket.on("msgParaServidor", (data) => {
    socket.emit("msgParaCliente", {
      nome: data.nome,
      mensagem: data.mensagem,
    });

    socket.broadcast.emit("msgParaCliente", {
      nome: data.nome,
      mensagem: data.mensagem,
    });
  });
});
